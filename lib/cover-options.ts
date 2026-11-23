// Forme et dégradé de la couverture (Complément 3) — "droite"/"aucun" sont
// gratuits, le reste est réservé au Pack Pro. Fonctions pures, importables
// depuis un composant client.

export type CoverShape = "droite" | "courbe" | "vague" | "arche";
export type CoverGradient = "aucun" | "leger" | "moyen" | "fort";

export const COVER_SHAPES: { id: CoverShape; label: string; free: boolean }[] = [
  { id: "droite", label: "Droite", free: true },
  { id: "courbe", label: "Courbe", free: false },
  { id: "vague", label: "Vague", free: false },
  { id: "arche", label: "Arche", free: false },
];

export const COVER_GRADIENTS: { id: CoverGradient; label: string; free: boolean }[] = [
  { id: "aucun", label: "Aucun", free: true },
  { id: "leger", label: "Léger", free: false },
  { id: "moyen", label: "Moyen", free: false },
  { id: "fort", label: "Fort", free: false },
];

// Hauteur de la bande de dégradé (en % de la hauteur de la couverture).
export const GRADIENT_HEIGHT_PCT: Record<CoverGradient, number> = {
  aucun: 0,
  leger: 22,
  moyen: 38,
  fort: 55,
};

// Chemins SVG (viewBox 0 0 400 80) de la zone remplie par la couleur de fond
// du thème, en dessous de la courbe — "droite" n'a pas de superposition.
export const COVER_SHAPE_PATHS: Record<Exclude<CoverShape, "droite">, string> = {
  courbe: "M0,34 C120,4 280,4 400,34 L400,80 L0,80 Z",
  vague: "M0,40 C60,12 100,12 150,40 C200,68 250,68 300,40 C350,12 380,12 400,32 L400,80 L0,80 Z",
  arche: "M0,16 C90,76 310,76 400,16 L400,80 L0,80 Z",
};
