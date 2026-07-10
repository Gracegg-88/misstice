export type Vendor = {
  id: string;
  name: string;
  category: string;
  city: string;
  region: string;
  priceLevel: 1 | 2 | 3; // € / €€ / €€€
  priceFrom: string; // libellé affiché
  rating: number;
  reviews: number;
  verified: boolean; // vérifié par Misstice
  responseHours: number;
  responseRate: number;
  languages: string[];
  tagline: string;
  reviewSnippet?: string;
  reviewAuthor?: string;
  grad: string; // dégradé de repli
  img: string; // photo
  userId?: string | null; // compte prestataire lié (null = fiche démo, non contactable)
  about?: string | null; // description réelle (vendor_profiles.about)
  // Ambiance & Vibe (tags renseignés par le prestataire).
  moods: string[];
  energies: string[];
  lights: string[];
  palettes: string[];
  atmospheres: string[];
  music: string[];
};

export const LANGUAGES = [
  "Français",
  "Anglais",
  "Espagnol",
  "Arabe",
  "Italien",
  "Allemand",
];

// Coordonnées approximatives par ville (pour la carte Leaflet).
export const CITY_COORDS: Record<string, [number, number]> = {
  Paris: [48.8566, 2.3522],
  Lyon: [45.764, 4.8357],
  Marseille: [43.2965, 5.3698],
  Bordeaux: [44.8378, -0.5792],
  Toulouse: [43.6047, 1.4442],
  Nantes: [47.2184, -1.5536],
  Lille: [50.6292, 3.0573],
  Strasbourg: [48.5734, 7.7521],
  Nice: [43.7102, 7.262],
};

function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Léger décalage déterministe pour éviter que deux pins d'une même ville
// se superposent parfaitement.
export function getCoords(v: Vendor): [number, number] {
  const base = CITY_COORDS[v.city] ?? [46.6, 2.4];
  const h = hashId(v.id);
  const jitter = ((h * 37) % 100) / 1000 - 0.05;
  const jitter2 = ((h * 53) % 100) / 1000 - 0.05;
  return [base[0] + jitter, base[1] + jitter2];
}
