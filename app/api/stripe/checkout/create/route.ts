import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { quoteTotals } from "@/lib/quote-doc";
import { getCurrentEvent } from "@/lib/queries";
import type { QuoteItem } from "@/lib/pro-types";

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
    .select(
      "id, conversation_id, status, presta_name, items, service_fee, tax_rate"
    )
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
    // conversations.event_id n'est pas toujours renseigné (conversation
    // créée avant qu'on le lie, ou via un parcours qui ne le fait pas) :
    // on retombe sur l'événement courant de la famille (même résolution
    // que le reste du dashboard — cookie `current_event_id`, sinon le plus
    // récent), pour ne jamais bloquer un paiement à tort.
    const current = await getCurrentEvent();
    eventDate = current?.event_date ?? null;
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
  // Recalculé depuis les lignes (comme le document affiché au client, cf.
  // DevisDocument.tsx) plutôt que lu depuis quotes.amount : ce dernier n'est
  // qu'une copie dénormalisée, écrite à chaque sauvegarde du devis mais pas
  // garantie à 100 % synchrone — le montant facturé doit toujours être celui
  // que le client voit sur le document, jamais une valeur qui pourrait diverger.
  const totals = quoteTotals(
    (quote.items as QuoteItem[]) ?? [],
    Number(quote.service_fee) || 0,
    Number(quote.tax_rate) || 0
  );
  const amountCents = Math.round(totals.total * 100);

  // Minimum Stripe pour un paiement par carte en EUR.
  if (amountCents < 50) {
    return NextResponse.json(
      { error: "Le montant de ce devis est trop faible pour être payé en ligne." },
      { status: 400 }
    );
  }

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
      // event_date figé ici : c'est lui qui sert de référence au séquestre
      // (fenêtre de litige + cron de libération), pas une re-résolution
      // ultérieure via conversations.event_id qui n'est pas toujours fiable.
      metadata: { quote_id: quoteId, event_date: eventDate },
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
