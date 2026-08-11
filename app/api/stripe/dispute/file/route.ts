import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Signalement d'un problème pendant la fenêtre de séquestre (jusqu'à
// escrow_event_date + 72h — vérifié côté base par file_quote_dispute).
// Règles automatiques prédéfinies (pas d'arbitrage humain à ce stade) :
//  • "prestataire_absent" → remboursement immédiat de la part prestataire
//    (85 %, la commission Misstice reste acquise) — cas non ambigu.
//  • "insatisfaction_qualite" → aucun remboursement automatique, litige
//    laissé ouvert pour médiation manuelle (voir /admin/devis).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { quoteId, reason } = (await request.json().catch(() => ({}))) as {
    quoteId?: string;
    reason?: string;
  };
  if (
    !quoteId ||
    (reason !== "prestataire_absent" && reason !== "insatisfaction_qualite")
  ) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, conversation_id, stripe_payment_intent_id, vendor_amount")
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote || !quote.conversation_id) {
    return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("particulier_id")
    .eq("id", quote.conversation_id)
    .maybeSingle();
  // Seule la famille peut signaler un problème sur son propre devis.
  if (!conversation || conversation.particulier_id !== user.id) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  const { data: ok, error: rpcErr } = await supabase.rpc("file_quote_dispute", {
    p_quote: quoteId,
    p_reason: reason,
  });
  if (rpcErr || ok === false) {
    return NextResponse.json(
      {
        error:
          rpcErr?.message ??
          "Impossible de signaler un problème sur ce devis (délai de 72h dépassé ou statut incompatible).",
      },
      { status: 400 }
    );
  }

  if (reason === "prestataire_absent") {
    if (!quote.stripe_payment_intent_id || quote.vendor_amount == null) {
      return NextResponse.json(
        {
          ok: true,
          status: "en litige",
          warning:
            "Litige enregistré, mais le remboursement automatique n'a pas pu être déclenché — l'équipe Misstice s'en charge manuellement.",
        }
      );
    }
    try {
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: quote.stripe_payment_intent_id,
        amount: Math.round(Number(quote.vendor_amount) * 100),
      });
    } catch (e) {
      console.error("dispute-file: échec remboursement Stripe", e);
      return NextResponse.json({
        ok: true,
        status: "en litige",
        warning:
          "Litige enregistré, mais le remboursement automatique a échoué — il sera traité manuellement.",
      });
    }
    const admin = createAdminClient();
    const { error: resolveErr } = await admin.rpc("resolve_quote_dispute", {
      p_quote: quoteId,
      p_refunded: true,
    });
    if (resolveErr) {
      console.error("dispute-file: resolve_quote_dispute échoué", resolveErr);
    }
    return NextResponse.json({ ok: true, status: "annulé" });
  }

  return NextResponse.json({ ok: true, status: "en litige" });
}
