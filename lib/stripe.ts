import Stripe from "stripe";

/**
 * Client Stripe — SERVEUR UNIQUEMENT (clé secrète). Jamais importé depuis un
 * composant client (voir NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY pour le navigateur).
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY manquant.");
  }
  // Pas d'apiVersion figée ici : on suit la version épinglée par le SDK
  // installé (package.json), mise à jour via `npm update stripe`.
  return new Stripe(key);
}
