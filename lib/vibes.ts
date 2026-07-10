// ============================================================================
//  Misstice — Vocabulaire « Ambiance & Vibe » (partagé client/serveur).
//  Aucune dépendance serveur → importable partout (filtres, badges, profil pro).
// ============================================================================

export const MOODS = [
  "Pastel",
  "Mystique",
  "Romantique",
  "Solaire",
  "Minimaliste",
  "Boho chic",
  "Glamour",
  "Nature",
] as const;

export const ENERGIES = [
  "Calme",
  "Chaleureux",
  "Festif",
  "Extraverti",
  "Discret",
  "Raffiné",
  "Créatif",
] as const;

// Filtres sensoriels — trois axes distincts.
export const LIGHTS = ["Chaude", "Tamisée", "Naturelle"] as const;
export const PALETTES = ["Pastel", "Nude", "Gold", "Blanc", "Terracotta"] as const;
export const ATMOSPHERES = ["Douce", "Dynamique", "Immersive"] as const;

// Style musical (surtout pour DJ / animateurs).
export const MUSIC_STYLES = [
  "Lounge",
  "Afro",
  "Pop",
  "Classique",
  "House",
  "Latino",
  "RnB",
  "Jazz",
  "Hip hop",
  "Trap",
] as const;

// Les tags « vibe » portés par un prestataire (colonnes vendors).
export type VendorVibes = {
  moods: string[];
  energies: string[];
  lights: string[];
  palettes: string[];
  atmospheres: string[];
  music: string[];
};

// La sélection de filtres côté visiteur (mêmes axes).
export type VibeSelection = VendorVibes;

export const EMPTY_VIBES: VendorVibes = {
  moods: [],
  energies: [],
  lights: [],
  palettes: [],
  atmospheres: [],
  music: [],
};

// Un prestataire correspond à la sélection si, pour chaque axe actif, il porte
// au moins un des tags choisis (OU intra-axe, ET inter-axes).
export function vendorMatchesVibes(v: VendorVibes, sel: VibeSelection): boolean {
  const axis = (tags: string[], selected: string[]) =>
    selected.length === 0 || selected.some((t) => tags.includes(t));
  return (
    axis(v.moods, sel.moods) &&
    axis(v.energies, sel.energies) &&
    axis(v.lights, sel.lights) &&
    axis(v.palettes, sel.palettes) &&
    axis(v.atmospheres, sel.atmospheres) &&
    axis(v.music, sel.music)
  );
}

// Nombre total de tags vibe sélectionnés (pour le compteur de filtres actifs).
export function countVibes(sel: VibeSelection): number {
  return (
    sel.moods.length +
    sel.energies.length +
    sel.lights.length +
    sel.palettes.length +
    sel.atmospheres.length +
    sel.music.length
  );
}

// Règle de « destitution » : les badges vibe ne s'affichent publiquement que si
// le prestataire garde une bonne réputation. Un nouveau prestataire (aucun avis)
// bénéficie du doute ; en dessous de 4/5 sur des avis réels, les badges tombent.
export function vibesVisible(rating: number, reviews: number): boolean {
  return reviews === 0 || rating >= 4;
}
