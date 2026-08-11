import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Accepte un devis (via la RPC existante set_quote_status, si pas déjà fait)
// puis crée une session de paiement Stripe pour le montant total. Bloque si
// l'événement du client n'a pas de date renseignée : c'est cette date qui
// sert de référence au séquestre (voir file_quote_dispute côté base).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { quoteId } = (await request.json().catch(() => ({}))) as {
    quoteId?: string;
  };
  if (!quoteId) {
    return NextResponse.json({ error: "Devis manquant." }, { status: 400 });
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, conversation_id, amount, status, presta_name")
    .eq("id", quoteId)
    .maybeSingle();

  if (
    !quote ||
    !quote.conversation_id ||
    !["envoyé", "accepté"].includes(quote.status)
  ) {
    return NextResponse.json(
      { error: "Ce devis ne peut pas être payé." },
      { status: 400 }
    );
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("event_id, particulier_id")
    .eq("id", quote.conversation_id)
    .maybeSingle();

  // Seule la famille (participante de la conversation, jamais le
  // prestataire) peut accepter et payer un devis.
  if (!conversation || conversation.particulier_id !== user.id) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  let eventDate: string | null = null;
  if (conversation.event_id) {
    const { data: event } = await supabase
      .from("events")
      .select("event_date")
      .eq("id", conversation.event_id)
      .maybeSingle();
    eventDate = event?.event_date ?? null;
  }

  if (!eventDate) {
    return NextResponse.json(
      {
        error:
          "Indiquez d'abord la date de votre événement avant d'accepter ce devis : elle nous permet de protéger votre paiement jusqu'au jour J.",
      },
      { status: 400 }
    );
  }

  if (quote.status === "envoyé") {
    const { data: accepted, error: acceptErr } = await supabase.rpc(
      "set_quote_status",
      { p_quote: quoteId, p_status: "accepté" }
    );
    if (acceptErr || accepted === false) {
      return NextResponse.json(
        { error: acceptErr?.message ?? "Impossible d'accepter ce devis." },
        { status: 400 }
      );
    }
  }

  const { origin } = new URL(request.url);
  const amountCents = Math.round(Number(quote.amount) * 100);

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: amountCents,
            product_data: {
              name: `Devis ${quote.presta_name ?? "prestataire"}, Misstice`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { quote_id: quoteId },
      success_url: `${origin}/devis/${quoteId}?checkout=success`,
      cancel_url: `${origin}/devis/${quoteId}?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("checkout-create: échec Stripe", e);
    return NextResponse.json(
      { error: "Le paiement n'a pas pu être initié. Réessayez dans quelques instants." },
      { status: 500 }
    );
  }
}
