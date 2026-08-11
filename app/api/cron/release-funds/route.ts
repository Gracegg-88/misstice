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
 * Tâche quotidienne (voir vercel.json) : libère les fonds séquestrés dont
 * la fenêtre de 72h après l'événement (escrow_event_date) est passée sans
 * litige actif — un devis en litige n'est plus au statut "en attente de
 * réalisation" (voir file_quote_dispute), donc n'apparaît jamais ici tant
 * qu'il n'est pas résolu (resolve_quote_dispute le renvoie en attente s'il
 * est rejeté, et il redevient éligible normalement).
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
    "quotes_eligible_for_release"
  );
  if (eligibleErr) {
    console.error("release-funds fetch:", eligibleErr);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }

  const rows =
    (eligible as {
      id: string;
      prestataire_id: string;
      vendor_amount: number;
      presta_name: string | null;
    }[]) ?? [];

  let released = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const { data: profile } = await admin
        .from("vendor_profiles")
        .select("stripe_account_id, payouts_enabled")
        .eq("id", row.prestataire_id)
        .maybeSingle();

      if (!profile?.stripe_account_id || !profile.payouts_enabled) {
        // Compte Stripe du prestataire non actif (ne devrait pas arriver,
        // il ne pourrait pas avoir été payé — sécurité supplémentaire) :
        // on ne libère rien, on retentera au prochain passage.
        console.error(
          "release-funds: compte Stripe non actif pour",
          row.prestataire_id
        );
        skipped += 1;
        continue;
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(Number(row.vendor_amount) * 100),
        currency: "eur",
        destination: profile.stripe_account_id,
        transfer_group: row.id,
      });

      const { error: rpcErr } = await admin.rpc("set_quote_transfer", {
        p_quote: row.id,
        p_transfer_id: transfer.id,
      });
      if (rpcErr) throw rpcErr;

      released += 1;

      try {
        const { data: authUser } = await admin.auth.admin.getUserById(
          row.prestataire_id
        );
        const to = authUser?.user?.email;
        if (to) {
          const amount = euro(Number(row.vendor_amount));
          const html = emailShell(`
            <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Fonds libérés ✔</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
              La prestation "${escapeHtml(
                row.presta_name || "votre devis"
              )}" est confirmée réalisée sans signalement : votre part de
              <strong>${amount}</strong> a été transférée sur votre compte Stripe.
            </p>`);
          await sendEmail({
            to,
            subject: "Misstice — Fonds libérés",
            html,
            text: `Votre part de ${amount} pour "${row.presta_name || "votre devis"}" a été transférée sur votre compte Stripe.`,
          });
        }
      } catch (e) {
        // Le virement a eu lieu — une erreur d'email ne doit pas la faire
        // remonter comme un échec du transfert.
        console.error("release-funds: email non envoyé", row.id, e);
      }
    } catch (e) {
      console.error("release-funds:", row.id, e);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, released, skipped, failed });
}
