import type { MetadataRoute } from "next";
import { getAllPublicVendors, getCities } from "@/lib/geo";
import { getRegionContentFile, isRegionIndexable, regionSlug } from "@/lib/region-content";
import {
  getIndexableCityCategoryPages,
  getIndexableCityHubs,
  getIndexableEventCityPages,
  getVendorProfileSignals,
  isVendorProfileIndexable,
  latestDate,
} from "@/lib/seo-rules";
import { SITE_URL as BASE_URL } from "@/lib/seo";

// Le sitemap ne liste QUE des pages indexables (mêmes règles que la balise
// robots de chaque page, voir lib/seo-rules.ts) et donne pour chacune sa
// vraie date de dernière modification — jamais la date du jour, sinon
// Google finit par ignorer ce signal.

// Pages publiques fixes. `lastModified` = date du dernier changement réel de
// leur contenu : à mettre à jour quand on modifie le texte d'une de ces pages.
// (Le reste — dashboard, pro, admin, auth, liens à token… — est volontairement
// exclu, voir app/robots.ts.)
const STATIC_ROUTES: {
  path: string;
  lastModified: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "", lastModified: "2026-11-20", priority: 1, changeFrequency: "weekly" },
  { path: "/comment-ca-marche", lastModified: "2026-11-20", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", lastModified: "2026-10-08", priority: 0.5, changeFrequency: "monthly" },
  { path: "/confiance", lastModified: "2026-10-08", priority: 0.7, changeFrequency: "monthly" },
  { path: "/devenir-prestataire", lastModified: "2026-10-22", priority: 0.8, changeFrequency: "monthly" },
  { path: "/creer", lastModified: "2026-10-19", priority: 0.8, changeFrequency: "monthly" },
  { path: "/organiser-un-mariage", lastModified: "2026-11-20", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-un-anniversaire", lastModified: "2026-11-20", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-un-bapteme", lastModified: "2026-10-08", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-un-evenement-professionnel", lastModified: "2026-11-20", priority: 0.7, changeFrequency: "monthly" },
  { path: "/organiser-une-baby-shower", lastModified: "2026-10-10", priority: 0.7, changeFrequency: "monthly" },
  { path: "/cgu", lastModified: "2026-10-22", priority: 0.3, changeFrequency: "yearly" },
  { path: "/mentions-legales", lastModified: "2026-10-08", priority: 0.3, changeFrequency: "yearly" },
];

const entry = (
  path: string,
  lastModified: Date | string | null,
  priority: number,
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
): MetadataRoute.Sitemap[number] => ({
  url: `${BASE_URL}${path}`,
  // Sans date connue, on omet lastmod plutôt que d'inventer « aujourd'hui ».
  ...(lastModified ? { lastModified } : {}),
  changeFrequency,
  priority,
});

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [vendors, hubs, categoryPages, eventPages] = await Promise.all([
    getAllPublicVendors(),
    getIndexableCityHubs(),
    getIndexableCityCategoryPages(),
    getIndexableEventCityPages(),
  ]);

  const staticEntries = STATIC_ROUTES.map((r) => entry(r.path, r.lastModified, r.priority, r.changeFrequency));
  // L'annuaire change dès qu'une fiche change.
  staticEntries.push(entry("/prestataires", latestDate(...vendors.map((v) => v.updatedAt)), 0.8, "daily"));

  // Fiches prestataires : uniquement celles qui remplissent les critères
  // automatiques (description ≥ 80 mots + photo du prestataire, voir
  // isVendorProfileIndexable). lastmod = vendors.updated_at.
  const signals = await getVendorProfileSignals(vendors.map((v) => v.userId).filter((id): id is string => !!id));
  const vendorEntries = vendors
    .filter((v) => isVendorProfileIndexable({ ...v, ...(v.userId ? signals.get(v.userId) : {}) }))
    .map((v) => entry(`/prestataires/${v.id}`, v.updatedAt ?? null, 0.6, "weekly"));

  // Hubs de région : seulement ceux dont le texte rédigé est publié.
  const regionSlugs = new Set((await getCities()).map((c) => regionSlug(c.region)));
  const regionEntries = Array.from(regionSlugs)
    .map((slug) => ({ slug, content: getRegionContentFile(slug) }))
    .filter((r) => isRegionIndexable(r.content))
    .map((r) => entry(`/region/${r.slug}`, r.content?.derniere_mise_a_jour || null, 0.6, "monthly"));

  return [
    ...staticEntries,
    ...regionEntries,
    ...vendorEntries,
    ...hubs.map((p) => entry(p.path, p.lastModified, 0.6, "weekly")),
    ...categoryPages.map((p) => entry(p.path, p.lastModified, 0.6, "weekly")),
    ...eventPages.map((p) => entry(p.path, p.lastModified, 0.65, "weekly")),
  ];
}
