// Adresse déjà publiée dans les mentions légales.
const CONTACT_EMAIL = "contact@misstice.com";

// Lien « Demander le retrait ou la rectification de cette fiche » des fiches
// vitrines non réclamées : un simple mailto pré-rempli, nom de la fiche dans
// l'objet pour qu'on retrouve tout de suite de quelle fiche il s'agit.
export function removalHref(vendorName: string): string {
  const subject = `Retrait ou rectification de fiche : ${vendorName}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
