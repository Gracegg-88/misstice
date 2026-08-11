import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Médiation manuelle d'un litige "insatisfaction_qualite" (pas de règle
// automatique — voir app/api/stripe/dispute/file/route.ts) : un admin
// décide au cas par cas. p_refunded=true rembourse la part prestataire
// (85 %, commission non remboursable) ; false rejette le litige et remet
// le devis en attente de réalisation (repris normalement par le cron de
// libération dès que le délai est repassé, voir quotes_eligible_for_release).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }

  const { quoteId, refunded } = (await request.json().catch(() => ({}))) as {
    quoteId?: string;
    refunded?: boolean;
  };
  if (!quoteId || typeof refunded !== "boolean") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: quote } = await admin
    .from("quotes")
    .select("status, stripe_payment_intent_id, vendor_amount")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote || quote.status !== "en litige") {
    return NextResponse.json(
      { error: "Ce devis n'est pas (ou plus) en litige." },
      { status: 400 }
    );
  }

  if (refunded) {
    if (!quote.stripe_payment_intent_id || quote.vendor_amount == null) {
      return NextResponse.json(
        { error: "Remboursement impossible : paiement introuvable." },
        { status: 400 }
      );
    }
    try {
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: quote.stripe_payment_intent_id,
        amount: Math.round(Number(quote.vendor_amount) * 100),
      });
    } catch (e) {
      console.error("dispute-resolve: échec remboursement Stripe", e);
      return NextResponse.json(
        { error: "Le remboursement Stripe a échoué. Réessayez dans quelques instants." },
        { status: 500 }
      );
    }
  }

  const { error: rpcErr } = await admin.rpc("resolve_quote_dispute", {
    p_quote: quoteId,
    p_refunded: refunded,
  });
  if (rpcErr) {
    console.error("dispute-resolve: resolve_quote_dispute échoué", rpcErr);
    return NextResponse.json(
      { error: "Le remboursement a eu lieu mais la mise à jour du devis a échoué." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: refunded ? "annulé" : "en attente de réalisation",
  });
}
