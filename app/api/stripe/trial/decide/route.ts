import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Après une rencontre/essai préalable (dégustation traiteur, essayage tenue,
// essai coiffure-maquillage), la famille confirme ou annule. En cas
// d'annulation, la part du prestataire (85 %) est remboursée — la
// commission Misstice (15 %) ne l'est jamais, l'argent n'ayant jamais
// quitté le solde plateforme (séparation charge/transfer).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { quoteId, confirmed } = (await request.json().catch(() => ({}))) as {
    quoteId?: string;
    confirmed?: boolean;
  };
  if (!quoteId || typeof confirmed !== "boolean") {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id, conversation_id, status, stripe_payment_intent_id, vendor_amount"
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (!quote || quote.status !== "en attente de confirmation") {
    return NextResponse.json(
      { error: "Ce devis n'est pas en attente de confirmation." },
      { status: 400 }
    );
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("particulier_id")
    .eq("id", quote.conversation_id)
    .maybeSingle();

  // Seule la famille (jamais le prestataire) confirme ou annule après la
  // rencontre.
  if (!conversation || conversation.particulier_id !== user.id) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  if (!confirmed) {
    if (!quote.stripe_payment_intent_id || quote.vendor_amount == null) {
      return NextResponse.json(
        { error: "Paiement introuvable pour ce devis." },
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
      console.error("trial-decide: échec remboursement Stripe", e);
      return NextResponse.json(
        { error: "Le remboursement n'a pas pu être effectué. Réessayez dans quelques instants." },
        { status: 500 }
      );
    }
  }

  const { data: ok, error: rpcErr } = await supabase.rpc("decide_quote_trial", {
    p_quote: quoteId,
    p_confirmed: confirmed,
  });
  if (rpcErr || ok === false) {
    return NextResponse.json(
      { error: rpcErr?.message ?? "Action impossible sur ce devis." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: confirmed ? "en attente de réalisation" : "annulé",
  });
}
