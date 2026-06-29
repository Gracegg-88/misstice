import type { Vendor } from "./vendors";

export const GALLERY_GRADS = [
  "from-violet to-festif",
  "from-festif to-emerald",
  "from-emerald to-violet",
  "from-violet to-emerald",
  "from-festif to-violet",
  "from-emerald to-festif",
  "from-violet to-festif",
  "from-festif to-emerald",
  "from-emerald to-violet",
];

export type Pkg = {
  name: string;
  price: string;
  popular?: boolean;
  features: string[];
};

const PKG_BY_CATEGORY: Record<string, Pkg[]> = {
  Photographe: [
    { name: "Demi-journée", price: "à partir de 800 €", features: ["4h de couverture", "150 photos retouchées", "Galerie en ligne privée"] },
    { name: "Journée complète", price: "1 400 €", popular: true, features: ["10h de couverture", "400+ photos retouchées", "Galerie + clé USB", "1 photographe assistant"] },
    { name: "Journée + album", price: "1 900 €", features: ["Tout le pack journée", "Album photo 30x30 relié", "Séance couple en extérieur"] },
  ],
  "DJ & Sono": [
    { name: "Soirée 4h", price: "à partir de 450 €", features: ["Sono pro", "Éclairage de base", "Playlist personnalisée"] },
    { name: "Soirée + cérémonie", price: "750 €", popular: true, features: ["Sonorisation cérémonie", "6h de mix", "Éclairage dancefloor", "Micro HF"] },
    { name: "Pack premium", price: "1 100 €", features: ["Sono + lumières architecturales", "Machine à fumée", "8h+ de set", "Repérage de salle"] },
  ],
  Traiteur: [
    { name: "Cocktail dînatoire", price: "à partir de 35 €/pers", features: ["10 pièces par invité", "Service inclus", "Boissons soft"] },
    { name: "Repas assis", price: "55 €/pers", popular: true, features: ["Entrée, plat, dessert", "Service à l'assiette", "Mise en place de salle"] },
    { name: "Formule tout compris", price: "75 €/pers", features: ["Cocktail + repas", "Open bar 4h", "Pièce montée", "Personnel dédié"] },
  ],
  "Salle de réception": [
    { name: "Location journée", price: "à partir de 1 600 €", features: ["Accès 10h-2h", "Tables & chaises", "Parking invités"] },
    { name: "Week-end", price: "2 800 €", popular: true, features: ["Vendredi au dimanche", "Cuisine équipée", "Hébergement 2 chambres"] },
    { name: "Tout inclus", price: "Sur devis", features: ["Salle + traiteur partenaire", "Décoration de base", "Coordination jour J"] },
  ],
};

const GENERIC_PKGS: Pkg[] = [
  { name: "Essentiel", price: "voir le devis", features: ["Prestation de base", "Échange préalable", "Devis détaillé"] },
  { name: "Confort", price: "voir le devis", popular: true, features: ["Prestation complète", "Options personnalisables", "Suivi dédié"] },
  { name: "Premium", price: "sur mesure", features: ["Sur-mesure intégral", "Accompagnement renforcé", "Disponibilité prioritaire"] },
];

export function getPackages(v: Vendor): Pkg[] {
  return PKG_BY_CATEGORY[v.category] ?? GENERIC_PKGS;
}

export type Review = {
  author: string;
  initial: string;
  date: string;
  rating: number;
  text: string;
  event: string;
};

// Avis d'exemple — volontairement avec des avis mitigés et négatifs :
// chez Misstice, TOUS les avis vérifiés sont publiés.
export function getReviews(v: Vendor): Review[] {
  const base: Review[] = [];
  if (v.reviewSnippet) {
    base.push({
      author: v.reviewAuthor ?? "Client vérifié",
      initial: (v.reviewAuthor ?? "C")[0],
      date: "mars 2026",
      rating: 5,
      text: v.reviewSnippet,
      event: "Prestation vérifiée",
    });
  }
  return [
    ...base,
    { author: "Sophie M.", initial: "S", date: "février 2026", rating: 5, text: "Professionnalisme au top, à l'écoute du début à la fin. Je recommande les yeux fermés.", event: "Mariage" },
    { author: "Thomas & Inès", initial: "T", date: "janvier 2026", rating: 5, text: "Exactement ce qu'on espérait. Le rapport qualité-prix est excellent.", event: "Anniversaire" },
    { author: "Nadia B.", initial: "N", date: "décembre 2025", rating: 4, text: "Très bon travail dans l'ensemble. Petit bémol sur le délai de réponse avant l'événement, mais le jour J était parfait.", event: "Baptême" },
    { author: "Julien R.", initial: "J", date: "novembre 2025", rating: 3, text: "Prestation correcte mais en deçà de mes attentes vu le prix. La communication aurait pu être plus fluide.", event: "Gala" },
    { author: "Carine D.", initial: "C", date: "octobre 2025", rating: 2, text: "Déçue : retard à l'installation et quelques détails oubliés. Le résultat final restait acceptable, mais je m'attendais à mieux.", event: "Mariage" },
  ];
}

// Répartition plausible des notes (croît avec la note moyenne).
export function ratingBreakdown(v: Vendor) {
  const r = v.rating;
  const p5 = Math.min(95, Math.max(40, Math.round(((r - 3.5) / 1.5) * 100)));
  const rest = 100 - p5;
  const p4 = Math.round(rest * 0.6);
  const p3 = Math.round(rest * 0.25);
  const p2 = Math.round(rest * 0.1);
  const p1 = Math.max(0, 100 - p5 - p4 - p3 - p2);
  return [
    { stars: 5, pct: p5 },
    { stars: 4, pct: p4 },
    { stars: 3, pct: p3 },
    { stars: 2, pct: p2 },
    { stars: 1, pct: p1 },
  ];
}
