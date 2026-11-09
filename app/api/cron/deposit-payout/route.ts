import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";
import { euro } from "@/lib/quote-doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Tâche quotidienne (voir vercel.json) : verse l'acompte dû au prestataire
 * (voir supabase/vendor-deposit.sql pour la règle de date). Utilise
 * `source_transaction` (la charge d'origine) plutôt qu'un virement "nu" :
 * un acompte part parfois quelques jours seulement après le paiement, avant
 * que les fonds soient "disponibles" sur le solde Stripe de la plateforme —
 * `source_transaction` permet à Stripe de prélever directement sur cette
 * charge sans attendre, et relie aussi ce virement à la charge pour qu'un
 * remboursement ultérieur avec `reverse_transfer` (litige "prestataire
 * absent") puisse le reprendre automatiquement si besoin.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: eligible, error: eligibleErr } = await admin.rpc(
    "quotes_eligible_for_deposit"
  );
  if (eligibleErr) {
    console.error("deposit-payout fetch:", eligibleErr);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }

  const rows =
    (eligible as {
      id: string;
      prestataire_id: string;
      deposit_amount: number;
      stripe_charge_id: string | null;
      presta_name: string | null;
    }[]) ?? [];

  let paid = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      if (!row.stripe_charge_id) {
        // Ne devrait pas arriver (charge toujours capturée avant le
        // passage en "en attente de réalisation") — sécurité supplémentaire,
        // on ne verse rien sans pouvoir relier le virement à son paiement.
        console.error("deposit-payout: charge introuvable pour", row.id);
        skipped += 1;
        continue;
      }

      const { data: profile } = await admin
        .from("vendor_profiles")
        .select("stripe_account_id, payouts_enabled")
        .eq("id", row.prestataire_id)
        .maybeSingle();

      if (!profile?.stripe_account_id || !profile.payouts_enabled) {
        console.error(
          "deposit-payout: compte Stripe non actif pour",
          row.prestataire_id
        );
        skipped += 1;
        continue;
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(row.deposit_amount) * 100),
        currency: "eur",
        destination: profile.stripe_account_id,
        transfer_group: row.id,
        source_transaction: row.stripe_charge_id,
      });

      const { error: rpcErr } = await admin.rpc("set_quote_deposit_transfer", {
        p_quote: row.id,
        p_transfer_id: transfer.id,
      });
      if (rpcErr) throw rpcErr;

      paid += 1;

      try {
        const { data: authUser } = await admin.auth.admin.getUserById(
          row.prestataire_id
        );
        const to = authUser?.user?.email;
        if (to) {
          const amount = euro(Number(row.deposit_amount));
          const html = emailShell(`
            <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Acompte versé ✔</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
              Votre acompte de <strong>${amount}</strong> pour la prestation
              "${escapeHtml(
                row.presta_name || "votre devis"
              )}" a été transféré sur votre compte Stripe. Le solde suivra
              normalement, 72h après l'événement.
            </p>`);
          await sendEmail({
            to,
            subject: "Misstice — Acompte versé",
            html,
            text: `Votre acompte de ${amount} pour "${row.presta_name || "votre devis"}" a été transféré sur votre compte Stripe.`,
          });
        }
      } catch (e) {
        // Le virement a eu lieu — une erreur d'email ne doit pas la faire
        // remonter comme un échec du virement.
        console.error("deposit-payout: email non envoyé", row.id, e);
      }
    } catch (e) {
      console.error("deposit-payout:", row.id, e);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, paid, skipped, failed });
}
