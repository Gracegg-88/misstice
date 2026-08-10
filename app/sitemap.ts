import type { MetadataRoute } from "next";
import { getVendors } from "@/lib/vendors";

const BASE_URL = "https://www.misstice.com";

// Pages publiques statiques. À compléter à chaque nouvelle page publique
// créée (le reste — dashboard, pro, admin, auth, liens à token… — est
// volontairement exclu, voir app/robots.ts).
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/comment-ca-marche", priority: 0.7, changeFrequency: "monthly" },
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

  return [...staticEntries, ...vendorEntries];
}
