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

// Type d'un avis réel (les avis proviennent de la table `reviews` via
// lib/vendors → getVendorReviews). Les anciens avis d'exemple ont été retirés.
export type Review = {
  author: string;
  initial: string;
  date: string;
  rating: number;
  text: string;
  event: string;
};
