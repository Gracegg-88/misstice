import type { MetadataRoute } from "next";
import { getVendors } from "@/lib/vendors";
import {
  getCities,
  getCityCategoryContent,
  getCityCategoryPickCombos,
  getCityEventContent,
  getCityEventPickCombos,
  getCitySlugsWithVendors,
  getEventTypes,
  getIndexableCityCategoryCombos,
  getIndexableCitySlugs,
  slugify,
} from "@/lib/geo";

const BASE_URL = "https://www.misstice.com";

// Pages publiques statiques. À compléter à chaque nouvelle page publique
// créée (le reste — dashboard, pro, admin, auth, liens à token… — est
// volontairement exclu, voir app/robots.ts).
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/comment-ca-marche", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/confiance", priority: 0.7, changeFrequency: "monthly" },
  { path: "/devenir-prestataire", priority: 0.8, changeFrequency: "monthly" },
  { path: "/creer", priority: 0.8, changeFrequency: "monthly" },
  { path: "/prestataires", priority: 0.8, changeFrequency: "daily" },
  { path: "/organiser-un-mariage", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-un-anniversaire", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-un-bapteme", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-un-evenement-professionnel", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-une-baby-shower", priority: 0.7, changeFrequency: "monthly" },
  { path: "/cgu", priority: 0.3, changeFrequency: "yearly" },
  { path: "/mentions-legales", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${BASE_URL}${r.path}`,
    lastModified: new Date(),
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Fiches prestataires publiques : uniquement celles déjà vérifiées, pour
  // ne jamais faire indexer un profil de test ou en attente de contrôle.
  const vendors = await getVendors();
  const vendorEntries: MetadataRoute.Sitemap = vendors
    .filter((v) => v.verified)
    .map((v) => ({
      url: `${BASE_URL}/prestataires/${v.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  // Pages géolocalisées : uniquement celles qui ont réellement du contenu
  // (jamais une page "bientôt disponible" dans le sitemap — ça signale à
  // Google une page à faible valeur, voir lib/geo.ts).
  const [
    citySlugsWithVendors,
    cities,
    cityCategoryCombos,
    indexableCitySlugs,
    eventTypes,
    editorialEventContent,
    editorialCategoryContent,
    categoryPickCombos,
    eventPickCombos,
  ] = await Promise.all([
    getCitySlugsWithVendors(),
    getCities(),
    getIndexableCityCategoryCombos(),
    getIndexableCitySlugs(),
    getEventTypes(),
    getCityEventContent(),
    getCityCategoryContent(),
    getCityCategoryPickCombos(),
    getCityEventPickCombos(),
  ]);
  const activeCitySlugs = new Set(citySlugsWithVendors);
  const cityBySlug = new Map(cities.map((c) => [c.slug, c]));

  const cityHubEntries: MetadataRoute.Sitemap = cities
    .filter((c) => activeCitySlugs.has(c.slug))
    .map((c) => ({
      url: `${BASE_URL}/prestataires/ville/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  // Publiée si assez de prestataires vérifiés, si un texte a été rédigé à la
  // main, OU si un Top 10 éditorial existe pour cette combinaison (voir
  // generateStaticParams de la page).
  const cityCategorySlugs = new Set([
    ...cityCategoryCombos.map((c) => `${c.citySlug}::${c.categorySlug}`),
    ...editorialCategoryContent.map((c) => `${c.citySlug}::${slugify(c.category)}`),
    ...categoryPickCombos.map((c) => `${c.citySlug}::${c.categorySlug}`),
  ]);
  const cityCategoryEntries: MetadataRoute.Sitemap = Array.from(cityCategorySlugs)
    .map((key) => {
      const [ville, categorie] = key.split("::");
      return { ville, categorie };
    })
    .filter((p) => cityBySlug.has(p.ville))
    .map((p) => ({
      url: `${BASE_URL}/prestataires/ville/${p.ville}/${p.categorie}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

  const eventCitySlugs = new Set([
    ...indexableCitySlugs.flatMap((ville) => eventTypes.map((et) => `${et.slug}::${ville}`)),
    ...editorialEventContent.map((c) => `${c.eventTypeSlug}::${c.citySlug}`),
    ...eventPickCombos.map((c) => `${c.eventTypeSlug}::${c.citySlug}`),
  ]);
  const eventCityEntries: MetadataRoute.Sitemap = Array.from(eventCitySlugs)
    .map((key) => {
      const [evenement, ville] = key.split("::");
      return { evenement, ville };
    })
    .filter((p) => cityBySlug.has(p.ville))
    .map((p) => ({
      url: `${BASE_URL}/${p.evenement}/${p.ville}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));

  return [...staticEntries, ...vendorEntries, ...cityHubEntries, ...cityCategoryEntries, ...eventCityEntries];
}
