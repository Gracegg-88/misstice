// Formatage du prix de départ ("price_from") saisi en texte libre par le
// prestataire — il peut taper "400", "dès 800 €" ou "Sur devis", d'où la
// normalisation ici plutôt qu'un simple affichage brut.

/** Normalise en "400€" / "dès 800 €" → "800€" / "Sur devis". */
export function formatPriceFrom(raw: string): string {
  const v = raw.trim();
  if (!v || v.toLowerCase() === "sur devis") return "Sur devis";
  const s = v.replace(/^dès\s*/i, "").trim();
  return /€/.test(s) ? s.replace(/\s+€/, "€") : `${s}€`;
}

/** Étiquette complète pour les blocs stats : "À partir de 400€" / "Sur devis". */
export function priceFromLabel(raw: string): string {
  const formatted = formatPriceFrom(raw);
  return formatted === "Sur devis" ? formatted : `À partir de ${formatted}`;
}
