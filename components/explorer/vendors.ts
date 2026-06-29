export type Vendor = {
  id: number;
  name: string;
  category: string;
  city: string;
  region: string;
  priceLevel: 1 | 2 | 3; // € / €€ / €€€
  priceFrom: string; // libellé affiché
  rating: number;
  reviews: number;
  verified: boolean; // vérifié par Misstice (pièces + références contrôlées)
  responseHours: number; // délai de réponse moyen
  responseRate: number; // % de demandes auxquelles le pro répond
  languages: string[];
  tagline: string;
  reviewSnippet?: string; // un vrai avis (vérifié) pour le côté inspirant
  reviewAuthor?: string;
  grad: string; // dégradé du visuel placeholder
  tall?: boolean; // visuel plus haut → effet masonry façon Pinterest
};

export const CATEGORIES = [
  "Photographe",
  "DJ & Sono",
  "Traiteur",
  "Décoration",
  "Salle de réception",
  "Pâtissier",
  "Wedding planner",
  "Fleuriste",
];

export const LANGUAGES = [
  "Français",
  "Anglais",
  "Wolof",
  "Lingala",
  "Arabe",
  "Bambara",
  "Créole",
];

export const VENDORS: Vendor[] = [
  { id: 1, name: "Studio Lumière", category: "Photographe", city: "Paris", region: "Île-de-France", priceLevel: 2, priceFrom: "dès 800 €", rating: 4.9, reviews: 127, verified: true, responseHours: 2, responseRate: 98, languages: ["Français", "Anglais"], tagline: "Reportage doux et lumineux, sans poses figées.", reviewSnippet: "Des photos qui nous ressemblent vraiment. Présent toute la journée, discret et adorable.", reviewAuthor: "Awa, mariée en 2025", grad: "from-violet to-festif", tall: true },
  { id: 2, name: "DJ Sankara", category: "DJ & Sono", city: "Lyon", region: "Auvergne-Rhône-Alpes", priceLevel: 2, priceFrom: "dès 450 €", rating: 4.8, reviews: 94, verified: true, responseHours: 3, responseRate: 95, languages: ["Français", "Lingala", "Anglais"], tagline: "Du coupé-décalé au dancefloor jusqu'à 5h.", grad: "from-festif to-emerald" },
  { id: 3, name: "Saveurs d'Afrique", category: "Traiteur", city: "Marseille", region: "PACA", priceLevel: 2, priceFrom: "dès 35 €/pers", rating: 5.0, reviews: 211, verified: true, responseHours: 4, responseRate: 99, languages: ["Français", "Wolof", "Bambara"], tagline: "Cuisine ouest-africaine et fusion, du buffet au service à l'assiette.", reviewSnippet: "Le thiéboudienne était parfait, et le buffet végé a régalé tout le monde.", reviewAuthor: "Fatou, baptême 2026", grad: "from-emerald to-violet", tall: true },
  { id: 4, name: "Atelier Fleur & Co", category: "Décoration", city: "Bordeaux", region: "Nouvelle-Aquitaine", priceLevel: 1, priceFrom: "dès 600 €", rating: 4.7, reviews: 63, verified: false, responseHours: 6, responseRate: 88, languages: ["Français"], tagline: "Scénographie florale bohème et durable.", grad: "from-violet to-emerald" },
  { id: 5, name: "Le Pavillon Royal", category: "Salle de réception", city: "Toulouse", region: "Occitanie", priceLevel: 3, priceFrom: "dès 2 500 €", rating: 4.9, reviews: 158, verified: true, responseHours: 5, responseRate: 96, languages: ["Français", "Anglais"], tagline: "Domaine avec parc, jusqu'à 250 invités.", reviewSnippet: "Cadre magnifique et équipe ultra pro. Aucun stress le jour J.", reviewAuthor: "Karim & Léa, 2025", grad: "from-festif to-violet", tall: true },
  { id: 6, name: "Douceurs de Maya", category: "Pâtissier", city: "Nantes", region: "Pays de la Loire", priceLevel: 1, priceFrom: "dès 120 €", rating: 4.8, reviews: 88, verified: true, responseHours: 2, responseRate: 97, languages: ["Français", "Créole"], tagline: "Wedding cakes et pièces montées sur-mesure.", grad: "from-emerald to-festif" },
  { id: 7, name: "Maison Diallo Events", category: "Wedding planner", city: "Paris", region: "Île-de-France", priceLevel: 3, priceFrom: "dès 3 000 €", rating: 5.0, reviews: 74, verified: true, responseHours: 1, responseRate: 100, languages: ["Français", "Anglais", "Wolof"], tagline: "Organisation clé en main, mariages mixtes et traditionnels.", reviewSnippet: "Elle a coordonné une cérémonie franco-sénégalaise sans accroc. Inestimable.", reviewAuthor: "Aminata, mariée 2026", grad: "from-violet to-festif", tall: true },
  { id: 8, name: "Beat & Bass", category: "DJ & Sono", city: "Lille", region: "Hauts-de-France", priceLevel: 1, priceFrom: "dès 350 €", rating: 4.5, reviews: 41, verified: false, responseHours: 8, responseRate: 82, languages: ["Français"], tagline: "DJ généraliste, ambiance familiale.", grad: "from-festif to-emerald" },
  { id: 9, name: "Clic & Clap Vidéo", category: "Photographe", city: "Bruxelles", region: "Diaspora", priceLevel: 2, priceFrom: "dès 950 €", rating: 4.9, reviews: 102, verified: true, responseHours: 3, responseRate: 94, languages: ["Français", "Anglais", "Arabe"], tagline: "Photo + film, montage cinématique en 4K.", grad: "from-emerald to-violet" },
  { id: 10, name: "Traiteur Le Baobab", category: "Traiteur", city: "Dakar", region: "Diaspora", priceLevel: 2, priceFrom: "dès 28 €/pers", rating: 4.8, reviews: 133, verified: true, responseHours: 5, responseRate: 93, languages: ["Français", "Wolof"], tagline: "Réceptions à Dakar et tournées en France.", reviewSnippet: "Service impeccable pour 180 invités, jusqu'au bout de la nuit.", reviewAuthor: "Mamadou, gala 2025", grad: "from-festif to-violet", tall: true },
  { id: 11, name: "Roses & Pivoines", category: "Fleuriste", city: "Lyon", region: "Auvergne-Rhône-Alpes", priceLevel: 2, priceFrom: "dès 400 €", rating: 4.6, reviews: 57, verified: true, responseHours: 4, responseRate: 90, languages: ["Français"], tagline: "Bouquets de saison, fleurs locales.", grad: "from-violet to-emerald" },
  { id: 12, name: "Élégance Décor", category: "Décoration", city: "Paris", region: "Île-de-France", priceLevel: 3, priceFrom: "dès 1 800 €", rating: 4.9, reviews: 119, verified: true, responseHours: 2, responseRate: 97, languages: ["Français", "Anglais"], tagline: "Décors haut de gamme, arches et mises en lumière.", reviewSnippet: "Salle transformée, nos invités n'en revenaient pas. Un travail d'orfèvre.", reviewAuthor: "Sarah & Yanis, 2026", grad: "from-emerald to-festif", tall: true },
  { id: 13, name: "Sweet Macaron", category: "Pâtissier", city: "Marseille", region: "PACA", priceLevel: 1, priceFrom: "dès 90 €", rating: 4.4, reviews: 38, verified: false, responseHours: 10, responseRate: 79, languages: ["Français"], tagline: "Buffet de desserts et candy bar.", grad: "from-festif to-emerald" },
  { id: 14, name: "Harmony Weddings", category: "Wedding planner", city: "Bordeaux", region: "Nouvelle-Aquitaine", priceLevel: 2, priceFrom: "dès 1 500 €", rating: 4.7, reviews: 66, verified: true, responseHours: 3, responseRate: 92, languages: ["Français", "Anglais"], tagline: "Coordination jour J et planification partielle.", grad: "from-violet to-festif" },
  { id: 15, name: "Royal Sound System", category: "DJ & Sono", city: "Paris", region: "Île-de-France", priceLevel: 2, priceFrom: "dès 550 €", rating: 4.8, reviews: 110, verified: true, responseHours: 2, responseRate: 96, languages: ["Français", "Lingala", "Anglais"], tagline: "Afrobeats, zouk, RnB — set 100% live mix.", reviewSnippet: "Le dancefloor n'a pas désempli. Lecture de la salle parfaite.", reviewAuthor: "Grace, mariage 2025", grad: "from-emerald to-violet", tall: true },
  { id: 16, name: "Jardin Secret", category: "Salle de réception", city: "Nantes", region: "Pays de la Loire", priceLevel: 2, priceFrom: "dès 1 600 €", rating: 4.6, reviews: 49, verified: true, responseHours: 6, responseRate: 89, languages: ["Français"], tagline: "Orangerie et jardin clos, jusqu'à 120 invités.", grad: "from-festif to-violet" },
  { id: 17, name: "Pixel & Or", category: "Photographe", city: "Toulouse", region: "Occitanie", priceLevel: 1, priceFrom: "dès 650 €", rating: 4.5, reviews: 52, verified: false, responseHours: 7, responseRate: 85, languages: ["Français", "Arabe"], tagline: "Style éditorial, retouche naturelle.", grad: "from-violet to-emerald" },
  { id: 18, name: "Lys Blanc Fleurs", category: "Fleuriste", city: "Bruxelles", region: "Diaspora", priceLevel: 2, priceFrom: "dès 380 €", rating: 4.7, reviews: 44, verified: true, responseHours: 4, responseRate: 91, languages: ["Français", "Anglais"], tagline: "Compositions modernes et arches fleuries.", grad: "from-emerald to-festif" },
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
  Bruxelles: [50.8503, 4.3517],
  Dakar: [14.7167, -17.4677],
};

// Léger décalage déterministe pour éviter que deux pins d'une même ville
// se superposent parfaitement.
export function getCoords(v: Vendor): [number, number] {
  const base = CITY_COORDS[v.city] ?? [46.6, 2.4];
  const jitter = ((v.id * 37) % 100) / 1000 - 0.05;
  const jitter2 = ((v.id * 53) % 100) / 1000 - 0.05;
  return [base[0] + jitter, base[1] + jitter2];
}
