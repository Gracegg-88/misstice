// Acompte prestataire — calculs & formatage, SANS dépendance serveur
// (importable côté client). La vraie valeur (deposit_amount) est toujours
// calculée côté base au paiement (mark_quote_paid) sur le montant réellement
// encaissé — ces fonctions ne servent qu'à l'AFFICHAGE avant paiement
// (estimation) et à la mise en forme des dates.

/** null (profil) → suit le défaut de la catégorie. */
export function resolveDepositPercent(
  vendorDefault: number | null,
  categoryDefault: number
): number {
  return vendorDefault ?? categoryDefault;
}

/** Estimation avant paiement : pourcentage × 85 % du montant total du devis. */
export function estimateDeposit(totalAmount: number, depositPercent: number): number {
  const vendorShare = totalAmount * 0.85;
  return Math.round(vendorShare * (depositPercent / 100) * 100) / 100;
}

export function fmtDepositDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
