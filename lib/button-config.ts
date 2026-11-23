// Boutons d'action affichés sur la fiche publique (vendor_profiles.button_config).
// "devis" et "message" restent toujours affichés (cœur du modèle Misstice,
// non désactivables) : seuls "disponibilites" et "composer" sont réglables
// depuis l'onglet « Ma page » → Boutons. Fonctions pures, importables côté
// client comme côté public (VendorProfile.tsx).

export type OptionalButtonId = "disponibilites" | "composer";

export const DEFAULT_BUTTON_CONFIG = [
  "devis",
  "message",
  "disponibilites",
  "composer",
];

export const OPTIONAL_BUTTONS: { id: OptionalButtonId; label: string }[] = [
  { id: "disponibilites", label: "Voir mes disponibilités" },
  { id: "composer", label: "Composer mon devis" },
];

/** "devis"/"message" sont toujours actifs ; les autres suivent button_config
 *  (absent du tableau = désactivé). Sans réglage (ancien profil), tout est actif. */
export function isButtonEnabled(
  buttonConfig: string[] | undefined,
  id: OptionalButtonId
): boolean {
  if (!buttonConfig) return true;
  return buttonConfig.includes(id);
}

export function toggleOptionalButton(
  buttonConfig: string[],
  id: OptionalButtonId
): string[] {
  return buttonConfig.includes(id)
    ? buttonConfig.filter((b) => b !== id)
    : [...buttonConfig, id];
}
