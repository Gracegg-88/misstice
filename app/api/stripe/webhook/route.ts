import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Point d'entrée unique pour tous les événements Stripe (compte Connect,
// paiement, remboursement...). Signature vérifiée avant tout traitement :
// c'est la SEULE façon dont l'état "payé" / "Stripe actif" doit atteindre
// notre base (jamais via un simple appel client après redirection).
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  // Deux webhooks Stripe distincts pointent vers cette même URL (Stripe
  // impose deux « destinations » séparées selon le périmètre choisi à leur
  // création) : STRIPE_WEBHOOK_SECRET pour les événements « Comptes
  // connectés » (account.updated), STRIPE_WEBHOOK_SECRET_ACCOUNT pour les
  // événements « Votre compte » (checkout.session.completed, le paiement
  // client a lieu sur le compte plateforme, pas sur un compte connecté).
  // Chaque destination a sa propre clé de signature, donc on essaie les deux.
  const secrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_ACCOUNT,
  ].filter((s): s is string => Boolean(s));
  if (!signature || secrets.length === 0) {
    return NextResponse.json({ error: "Configuration manquante." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event | undefined;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      break;
    } catch {
      // Essayé avec la mauvaise clé : on tente la suivante avant d'abandonner.
    }
  }
  if (!event) {
    console.error("stripe-webhook: signature invalide (aucune clé ne correspond)");
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      // On identifie le prestataire par l'ID de compte Stripe déjà enregistré
      // (écrit dès la création du compte, avant même la redirection vers le
      // formulaire) plutôt que par des métadonnées, pour ne dépendre d'aucun
      // état intermédiaire côté Stripe.
      const { data: vendorProfile } = await admin
        .from("vendor_profiles")
        .select("id")
        .eq("stripe_account_id", account.id)
        .maybeSingle();
      if (!vendorProfile) {
        // Compte inconnu de notre base (ne devrait pas arriver) : ignoré.
        break;
      }
      const payoutsEnabled = Boolean(account.payouts_enabled);
      const status = payoutsEnabled ? "actif" : "en_attente";
      const { error } = await admin.rpc("set_stripe_account_status", {
        p_profile_id: vendorProfile.id,
        p_account_id: account.id,
        p_status: status,
        p_payouts_enabled: payoutsEnabled,
      });
      if (error) console.error("stripe-webhook: mise à jour statut échouée", error);
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const quoteId = session.metadata?.quote_id;
      if (!quoteId || session.payment_status !== "paid") {
        break;
      }
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
      const { error } = await admin.rpc("mark_quote_paid", {
        p_quote: quoteId,
        p_session_id: session.id,
        p_payment_intent_id: paymentIntentId,
      });
      if (error) console.error("stripe-webhook: mark_quote_paid échoué", error);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
