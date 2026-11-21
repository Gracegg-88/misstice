// Thèmes de la fiche prestataire — chaque thème a son propre accent, jamais
// calqué sur l'identité Misstice (sauf "Nuit", variante sombre assumée de
// cette identité). Les couleurs sont validées AA une fois pour toutes ici
// (voir scripts/check-theme-contrast.mjs) : aucune vérification en direct
// n'est nécessaire pour un preset — seul le mode personnalisé (PR2) en aura
// besoin.
//
// Rôles :
//  - ground / text       : fond de page / texte principal
//  - surface / surfaceText : encadrés (formules, book...) / texte dessus
//  - buttonBg / buttonText : CTA pleins ("Demander un devis"...)
//  - accent              : DÉCORATIF UNIQUEMENT (filets, bordures, icônes) —
//    jamais utilisé comme couleur de texte.
//
// La zone de confiance (components/explorer/TrustZone.tsx) n'utilise AUCUNE
// de ces couleurs : elle reste identique quel que soit le thème choisi.

export type ThemeTier = "free" | "pro";

export type ThemeColors = {
  ground: string;
  text: string;
  heading: string;
  muted: string; // texte secondaire (sous-titres, légendes) — doit aussi passer AA sur `ground`
  surface: string;
  surfaceText: string;
  buttonBg: string;
  buttonText: string;
  accent: string;
};

export type Theme = {
  id: string;
  name: string;
  tier: ThemeTier;
  colors: ThemeColors;
};

export const THEMES: Theme[] = [
  {
    id: "signature",
    name: "Signature",
    tier: "free",
    // Identité Misstice actuelle (PR0) : thème par défaut si rien n'est choisi.
    colors: {
      ground: "#FAFAF9",
      text: "#1E1240",
      muted: "#5B564E",
      heading: "#1E1240",
      surface: "#FFFFFF",
      surfaceText: "#1E1240",
      buttonBg: "#6C3CE1",
      buttonText: "#FAFAF9",
      accent: "#D9B25F",
    },
  },
  {
    id: "nuit",
    name: "Nuit",
    tier: "free",
    // Variante sombre assumée de l'identité Misstice.
    colors: {
      ground: "#1E1240",
      text: "#FAFAF9",
      muted: "#C9C2E0",
      heading: "#FAFAF9",
      surface: "#2A1B52",
      surfaceText: "#FAFAF9",
      buttonBg: "#A98BF0",
      buttonText: "#1E1240",
      accent: "#A98BF0",
    },
  },
  {
    id: "ivoire-or",
    name: "Ivoire & Or",
    tier: "free",
    colors: {
      ground: "#FAF6EC",
      text: "#241F1A",
      muted: "#5B564E",
      heading: "#241F1A",
      surface: "#FFFFFF",
      surfaceText: "#241F1A",
      buttonBg: "#241F1A",
      buttonText: "#FAF6EC",
      accent: "#C9A56B",
    },
  },
  {
    id: "emeraude",
    name: "Émeraude",
    tier: "free",
    colors: {
      ground: "#F7F3EC",
      text: "#1E2621",
      muted: "#5B564E",
      heading: "#1F3D33",
      surface: "#FFFFFF",
      surfaceText: "#1E2621",
      buttonBg: "#1F3D33",
      buttonText: "#F7F3EC",
      accent: "#B08D57",
    },
  },
  {
    id: "terracotta",
    name: "Terracotta",
    tier: "free",
    colors: {
      ground: "#F5F0E8",
      text: "#1C2230",
      muted: "#5B564E",
      heading: "#1C2230",
      surface: "#FFFFFF",
      surfaceText: "#1C2230",
      buttonBg: "#A2553D",
      buttonText: "#FFFFFF",
      accent: "#A2553D",
    },
  },
  {
    id: "noir-elegant",
    name: "Noir élégant",
    tier: "free",
    colors: {
      ground: "#1A1A1A",
      text: "#F2F0ED",
      muted: "#B9B6AE",
      heading: "#F2F0ED",
      surface: "#242424",
      surfaceText: "#F2F0ED",
      buttonBg: "#FFFFFF",
      buttonText: "#17161A",
      accent: "#B9B6AE",
    },
  },
  {
    id: "prune-champagne",
    name: "Prune & Champagne",
    tier: "pro",
    // Verrouillé en PR1 — couleurs définitives confirmées en PR2.
    colors: {
      ground: "#F7F1EA",
      text: "#2A1824",
      muted: "#5B564E",
      heading: "#3B1F33",
      surface: "#FFFFFF",
      surfaceText: "#2A1824",
      buttonBg: "#3B1F33",
      buttonText: "#F7F1EA",
      accent: "#C9A96E",
    },
  },
  {
    id: "nuit-etoilee",
    name: "Nuit étoilée",
    tier: "pro",
    // Verrouillé en PR1 — couleurs/animation définitives en PR2.
    colors: {
      ground: "#0E0B1A",
      text: "#EDE9F7",
      muted: "#A79FC2",
      heading: "#EDE9F7",
      surface: "#1B1530",
      surfaceText: "#EDE9F7",
      buttonBg: "#D9B25F",
      buttonText: "#1E1240",
      accent: "#D9B25F",
    },
  },
  {
    id: "dore-prestige",
    name: "Doré Prestige",
    tier: "pro",
    // Verrouillé en PR1 — couleurs définitives confirmées en PR2.
    colors: {
      ground: "#241A12",
      text: "#F3E9D8",
      muted: "#B9A98E",
      heading: "#F3E9D8",
      surface: "#352415",
      surfaceText: "#F3E9D8",
      buttonBg: "#C9A96E",
      buttonText: "#241A12",
      accent: "#C9A96E",
    },
  },
];

export const DEFAULT_THEME_ID = "signature";

export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Un prestataire ne peut choisir que les thèmes gratuits en PR1. */
export function isThemeSelectable(theme: Theme): boolean {
  return theme.tier === "free";
}
