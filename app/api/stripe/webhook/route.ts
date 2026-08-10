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
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "Configuration manquante." }, { status: 500 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("stripe-webhook: signature invalide", e);
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

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
