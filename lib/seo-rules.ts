import { cache } from "react";
import {
  getCities,
  getCityCategoryContent,
  getCityEventContent,
  getEventTypes,
  getAllPicksByCombo,
  getAllPublicVendors,
  getKnownCategorySlugs,
  getVendorsForCity,
  slugify,
  type City,
  type DirectoryPick,
} from "@/lib/geo";
import { createStaticClient } from "@/lib/supabase/static";
import { getCityEventContentFile, isCityEventIndexable } from "@/lib/city-content";
import type { Vendor } from "@/components/explorer/vendors";

/**
 * Règles d'indexation SEO — UNE seule source de vérité, partagée par :
 * le sitemap, la balise robots de chaque page, et le maillage interne
 * (on ne fait jamais de lien « mis en avant » vers une page non indexable).
 *
 * N = MIN_LISTED_VENDORS : nombre minimum de prestataires réels pour qu'une
 * page ville ou ville × catégorie soit indexée. « Réels » = fiches publiques
 * de l'annuaire (vérifiées, ou fiches vitrines importées du répertoire
 * SIRENE — de vraies entreprises), jamais retirées, plus les sélections
 * « Top 10 » rédigées et sourcées à la main pour la page concernée.
 */
export const MIN_LISTED_VENDORS = 3;

/** Plus récente de plusieurs dates (ISO ou Date), null si aucune. */
export function latestDate(...dates: (string | Date | null | undefined)[]): Date | null {
  let best: Date | null = null;
  for (const d of dates) {
    if (!d) continue;
    const date = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(date.getTime())) continue;
    if (!best || date > best) best = date;
  }
  return best;
}

const vendorsLastModified = (vendors: Vendor[]) => latestDate(...vendors.map((v) => v.updatedAt));
const picksLastModified = (picks: DirectoryPick[]) => latestDate(...picks.map((p) => p.verified_at));

// ─── Fiches prestataires ──────────────────────────────────────────────────

/**
 * Critères d'indexation d'une fiche prestataire (automatiques : une fiche
 * qui les remplit entre dans le sitemap sans intervention, et sa date
 * updated_at est mise à jour par les déclencheurs de
 * supabase/vendors-updated-at.sql quand la description ou les photos
 * changent) :
 * 1. fiche publique et non retirée ;
 * 2. description (« À propos ») écrite par le prestataire d'au moins
 *    MIN_ABOUT_WORDS mots ;
 * 3. au moins une photo fournie par le prestataire : une photo de son book
 *    (vendor_photos) ou une photo principale envoyée depuis son espace pro
 *    (stockage vendor-photos) — jamais une image par défaut.
 * Les fiches importées du répertoire des entreprises n'ont ni description
 * ni photo : elles restent consultables, en noindex.
 */
export const MIN_ABOUT_WORDS = 80;

/** Photo principale envoyée par le prestataire lui-même (et non une image par défaut). */
export const isVendorUploadedImage = (url: string | null | undefined) =>
  !!url && url.includes("/storage/v1/object/public/vendor-photos/");

export const countWords = (text: string | null | undefined) =>
  (text ?? "").trim().split(/\s+/).filter(Boolean).length;

export function isVendorProfileIndexable(
  v: Pick<Vendor, "claimStatus" | "verified" | "retired" | "img"> & {
    about?: string | null;
    /** Nombre de photos du book (vendor_photos). */
    photoCount?: number;
  }
): boolean {
  if (v.retired) return false;
  if (!(v.claimStatus === "non_reclamee" || v.verified)) return false;
  if (countWords(v.about) < MIN_ABOUT_WORDS) return false;
  return (v.photoCount ?? 0) > 0 || isVendorUploadedImage(v.img);
}

/**
 * Description et nombre de photos des prestataires inscrits, en une fois
 * (sitemap, listes). Clé : id du compte prestataire (vendors.user_id).
 */
export const getVendorProfileSignals = cache(
  async (userIds: string[]): Promise<Map<string, { about: string | null; photoCount: number }>> => {
    const map = new Map<string, { about: string | null; photoCount: number }>();
    if (!userIds.length) return map;
    const supabase = createStaticClient();
    const [{ data: profiles }, { data: photos }] = await Promise.all([
      supabase.from("vendor_profiles").select("id, about").in("id", userIds),
      supabase.from("vendor_photos").select("vendor_id").in("vendor_id", userIds),
    ]);
    for (const id of userIds) map.set(id, { about: null, photoCount: 0 });
    for (const p of (profiles as { id: string; about: string | null }[] | null) ?? []) {
      map.get(p.id)!.about = p.about;
    }
    for (const p of (photos as { vendor_id: string }[] | null) ?? []) {
      const entry = map.get(p.vendor_id);
      if (entry) entry.photoCount += 1;
    }
    return map;
  }
);

// ─── Pages géolocalisées ──────────────────────────────────────────────────

export type GeoPageState = {
  indexable: boolean;
  /** Prestataires réels comptés pour la règle (annuaire + Top 10). */
  listedCount: number;
  lastModified: Date | null;
};

/** /prestataires/ville/{ville} */
export async function getCityHubState(citySlug: string): Promise<GeoPageState> {
  const vendors = await getVendorsForCity(citySlug);
  return {
    indexable: vendors.length >= MIN_LISTED_VENDORS,
    listedCount: vendors.length,
    lastModified: vendorsLastModified(vendors),
  };
}

/** /prestataires/ville/{ville}/{categorie} */
export async function getCityCategoryState(citySlug: string, categorySlug: string): Promise<GeoPageState> {
  const [cityVendors, picksByCombo, content] = await Promise.all([
    getVendorsForCity(citySlug),
    getAllPicksByCombo(),
    getCityCategoryContent(),
  ]);
  const vendors = cityVendors.filter((v) => v.category && slugify(v.category) === categorySlug);
  const picks = picksByCombo[`${citySlug}::${categorySlug}`] ?? [];
  const intro = content.find((c) => c.citySlug === citySlug && slugify(c.category) === categorySlug);
  const listedCount = vendors.length + picks.length;
  return {
    indexable: listedCount >= MIN_LISTED_VENDORS,
    listedCount,
    lastModified: latestDate(vendorsLastModified(vendors), picksLastModified(picks), intro?.createdAt),
  };
}

/**
 * /{evenement}/{ville} (guide local) :
 * - fiche content/villes : indexée seulement si "publier": true (contenu
 *   rédigé et relu, voir lib/city-content.ts) ;
 * - sinon : il faut un texte rédigé pour cette ville et cet événement
 *   (city_event_content) ET au moins N prestataires réels dans la ville
 *   (ou dans le Top 10 de la page). Sans texte rédigé, la page n'est qu'un
 *   gabarit répété pour chaque événement de la ville → noindex.
 */
export async function getEventCityState(citySlug: string, eventTypeSlug: string): Promise<GeoPageState> {
  const file = getCityEventContentFile(citySlug, eventTypeSlug);
  const [vendors, picksByCombo, content] = await Promise.all([
    getVendorsForCity(citySlug),
    getAllPicksByCombo(),
    getCityEventContent(),
  ]);
  const picks = picksByCombo[`${citySlug}::${eventTypeSlug}`] ?? [];
  const intro = content.find((c) => c.citySlug === citySlug && c.eventTypeSlug === eventTypeSlug);
  const listedCount = vendors.length + picks.length;
  const lastModified = latestDate(
    file?.derniere_mise_a_jour,
    intro?.createdAt,
    vendorsLastModified(vendors),
    picksLastModified(picks)
  );
  if (file) return { indexable: isCityEventIndexable(file), listedCount, lastModified };
  return {
    indexable: Boolean(intro?.introText?.trim()) && listedCount >= MIN_LISTED_VENDORS,
    listedCount,
    lastModified,
  };
}

// ─── Listes de pages indexables (sitemap + maillage interne) ───────────────

export type IndexablePage = { path: string; city: City; lastModified: Date | null; listedCount: number };

export const getIndexableCityHubs = cache(async (): Promise<IndexablePage[]> => {
  const cities = await getCities();
  const out: IndexablePage[] = [];
  for (const city of cities) {
    const s = await getCityHubState(city.slug);
    if (s.indexable) out.push({ path: `/prestataires/ville/${city.slug}`, city, lastModified: s.lastModified, listedCount: s.listedCount });
  }
  return out.sort((a, b) => b.listedCount - a.listedCount);
});

export const getIndexableCityCategoryPages = cache(
  async (): Promise<(IndexablePage & { categorySlug: string; category: string })[]> => {
    const [cities, known, vendors, picksByCombo] = await Promise.all([
      getCities(),
      getKnownCategorySlugs(),
      getAllPublicVendors(),
      getAllPicksByCombo(),
    ]);
    const cityBySlug = new Map(cities.map((c) => [c.slug, c]));
    const keys = new Set<string>();
    for (const v of vendors) if (v.city && v.category) keys.add(`${slugify(v.city)}::${slugify(v.category)}`);
    for (const key of Object.keys(picksByCombo)) keys.add(key);
    const out: (IndexablePage & { categorySlug: string; category: string })[] = [];
    for (const key of Array.from(keys)) {
      const [citySlug, categorySlug] = key.split("::");
      const city = cityBySlug.get(citySlug);
      const category = known.get(categorySlug);
      if (!city || !category) continue; // les clés « ville::événement » des Top 10 tombent ici
      const s = await getCityCategoryState(citySlug, categorySlug);
      if (s.indexable)
        out.push({ path: `/prestataires/ville/${citySlug}/${categorySlug}`, city, categorySlug, category, lastModified: s.lastModified, listedCount: s.listedCount });
    }
    return out.sort((a, b) => b.listedCount - a.listedCount);
  }
);

export const getIndexableEventCityPages = cache(
  async (): Promise<(IndexablePage & { eventTypeSlug: string })[]> => {
    const [cities, eventTypes] = await Promise.all([getCities(), getEventTypes()]);
    const out: (IndexablePage & { eventTypeSlug: string })[] = [];
    for (const city of cities) {
      for (const et of eventTypes) {
        const s = await getEventCityState(city.slug, et.slug);
        if (s.indexable)
          out.push({ path: `/${et.slug}/${city.slug}`, city, eventTypeSlug: et.slug, lastModified: s.lastModified, listedCount: s.listedCount });
      }
    }
    return out.sort((a, b) => b.listedCount - a.listedCount);
  }
);

/** Autres villes de la même région (cities.region), pour le maillage « villes proches ». */
export async function getSameRegionCities(city: City): Promise<City[]> {
  const cities = await getCities();
  return cities.filter((c) => c.region === city.region && c.slug !== city.slug);
}

/** « 1 fiche » / « 3 fiches » */
export const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
