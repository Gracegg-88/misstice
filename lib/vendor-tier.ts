import type { Vendor } from "@/components/explorer/vendors";

/**
 * Niveau de priorité d'une fiche dans l'annuaire (plus petit = plus haut),
 * appliqué avant tout autre tri :
 *   0. fiche réclamée, vérifiée ET paiements Stripe actifs (peut envoyer un
 *      devis et être payée tout de suite) ;
 *   1. fiche réclamée vérifiée, Stripe pas encore actif ;
 *   2. fiche vitrine importée, non réclamée.
 */
export function vendorTier(
  v: Pick<Vendor, "claimStatus" | "verified" | "payoutsEnabled">
): number {
  if (v.claimStatus !== "reclamee") return 2;
  return v.verified && v.payoutsEnabled ? 0 : 1;
}
