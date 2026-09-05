import { cache } from "react";
import { createStaticClient } from "@/lib/supabase/static";
import { getVendors } from "@/lib/vendors";
import type { Vendor } from "@/components/explorer/vendors";

// Données 100% publiques (RLS `using (true)`) : un seul client sans cookies,
// réutilisable aussi bien depuis generateStaticParams (build) que depuis le
// rendu des pages elles-mêmes — ces pages restent ainsi statiques (ISR),
// jamais dégradées en rendu dynamique par un appel à cookies().
function db() {
  return createStaticClient();
}

// Chaque page géo appelle generateMetadata() PUIS le composant de page, et
// les deux redemandent les mêmes données (ville, prestataires, contenu...).
// Sans cache(), c'était 2x plus de requêtes Supabase que nécessaire par
// page — jusqu'à une centaine d'appels quasi simultanés observés en prod
// lors d'une régénération ISR. cache() déduplique tous les appels
// identiques au sein d'un même rendu (une seule requête réseau, peu
// importe combien de fonctions en aval la redemandent).
const fetchVendorsCached = cache(() => getVendors(db()));
const fetchCitiesCached = cache(async (): Promise<City[]> => {
  const supabase = db();
  const { data } = await supabase.from("cities").select("slug, name, region").order("name");
  return (data as City[]) ?? [];
});
const fetchEventTypesCached = cache(async (): Promise<EventType[]> => {
  const supabase = db();
  const { data } = await supabase.from("event_types").select("slug, name").order("position");
  return (data as EventType[]) ?? [];
});
const fetchCityEventContentCached = cache(
  async (): Promise<
    { citySlug: string; eventTypeSlug: string; introText: string; imageUrl: string | null; imageAlt: string | null }[]
  > => {
    const supabase = db();
    const { data } = await supabase
      .from("city_event_content")
      .select("city_slug, event_type_slug, intro_text, image_url, image_alt");
    return (
      (data as
        | { city_slug: string; event_type_slug: string; intro_text: string; image_url: string | null; image_alt: string | null }[]
        | null) ?? []
    ).map((r) => ({
      citySlug: r.city_slug,
      eventTypeSlug: r.event_type_slug,
      introText: r.intro_text,
      imageUrl: r.image_url,
      imageAlt: r.image_alt,
    }));
  }
);
const fetchCityCategoryContentCached = cache(
  async (): Promise<
    { citySlug: string; category: string; introText: string; imageUrl: string | null; imageAlt: string | null }[]
  > => {
    const supabase = db();
    const { data } = await supabase
      .from("city_category_content")
      .select("city_slug, category, intro_text, image_url, image_alt");
    return (
      (data as
        | { city_slug: string; category: string; intro_text: string; image_url: string | null; image_alt: string | null }[]
        | null) ?? []
    ).map((r) => ({
      citySlug: r.city_slug,
      category: r.category,
      introText: r.intro_text,
      imageUrl: r.image_url,
      imageAlt: r.image_alt,
    }));
  }
);
const fetchKnownCategorySlugsCached = cache(async (): Promise<Map<string, string>> => {
  const supabase = db();
  const { data } = await supabase.from("vendor_categories").select("name");
  const map = new Map<string, string>();
  for (const c of (data as { name: string }[] | null) ?? []) {
    map.set(slugify(c.name), c.name);
  }
  return map;
});

const PICK_COLUMNS =
  "id, city_slug, rank, name, address, lat, lng, phone, price_level, description, source_url, claimed_vendor_id";

const fetchCityCategoryPicksCached = cache(async (): Promise<DirectoryPick[]> => {
  const supabase = db();
  const { data } = await supabase
    .from("city_category_picks")
    .select(`${PICK_COLUMNS}, category`)
    .order("rank");
  return (data as (DirectoryPick & { category: string })[] | null) ?? [];
});

const fetchCityEventPicksCached = cache(async (): Promise<DirectoryPick[]> => {
  const supabase = db();
  const { data } = await supabase
    .from("city_event_picks")
    .select(`${PICK_COLUMNS}, event_type_slug`)
    .order("rank");
  return (data as (DirectoryPick & { event_type_slug: string })[] | null) ?? [];
});

export type City = {
  slug: string;
  name: string;
  region: string;
};

export type EventType = {
  slug: string;
  name: string;
};

export type CityCategoryCombo = {
  citySlug: string;
  categorySlug: string;
  category: string;
  verifiedCount: number;
};

/**
 * Sélection éditoriale "Top 10" d'un prestataire public (pas forcément
 * inscrit sur Misstice), affichée sur une page ville×catégorie ou
 * ville×événement en attendant assez de vrais prestataires vérifiés — voir
 * public.city_category_picks / public.city_event_picks (supabase/directory-picks.sql).
 * Jamais générée en masse : chaque ligne est vérifiée à la main, sourceUrl
 * à l'appui.
 */
export type DirectoryPick = {
  id: string;
  city_slug: string;
  rank: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  price_level: string | null;
  description: string;
  source_url: string;
  claimed_vendor_id: string | null;
};

// Sous ce seuil, une page ville×catégorie (ou ville×événement) n'est pas
// générée statiquement : mieux vaut un état "bientôt disponible" honnête
// qu'une page quasi vide qui nuit au SEO (contenu "thin").
export const MIN_VERIFIED_VENDORS = 3;

/** Même normalisation que côté filtre existant (ExplorerClient), mais en slug d'URL stable. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getCities(): Promise<City[]> {
  return fetchCitiesCached();
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const cities = await getCities();
  return cities.find((c) => c.slug === slug) ?? null;
}

export async function getEventTypes(): Promise<EventType[]> {
  return fetchEventTypesCached();
}

export async function getEventTypeBySlug(slug: string): Promise<EventType | null> {
  const types = await getEventTypes();
  return types.find((t) => t.slug === slug) ?? null;
}

/** Prestataires d'une ville (tous, vérifiés ou non — comme l'annuaire /prestataires). */
export async function getVendorsForCity(citySlug: string): Promise<Vendor[]> {
  const vendors = await fetchVendorsCached();
  return vendors.filter((v) => v.city && slugify(v.city) === citySlug);
}

export async function getVendorsForCityCategory(
  citySlug: string,
  categorySlug: string
): Promise<Vendor[]> {
  const vendors = await getVendorsForCity(citySlug);
  return vendors.filter((v) => v.category && slugify(v.category) === categorySlug);
}

/** Slugs de toutes les villes ayant au moins un prestataire (pour generateStaticParams). */
export async function getCitySlugsWithVendors(): Promise<string[]> {
  const vendors = await fetchVendorsCached();
  const set = new Set<string>();
  for (const v of vendors) if (v.city) set.add(slugify(v.city));
  return Array.from(set);
}

/**
 * Combinaisons ville×catégorie au-dessus du seuil de publication — sert à la
 * fois de garde-fou (generateStaticParams) et de source pour le maillage
 * interne (liens "catégories disponibles dans cette ville").
 */
export async function getIndexableCityCategoryCombos(
  minVerified: number = MIN_VERIFIED_VENDORS
): Promise<CityCategoryCombo[]> {
  const vendors = await fetchVendorsCached();
  const map = new Map<string, CityCategoryCombo>();
  for (const v of vendors) {
    if (!v.city || !v.category) continue;
    const citySlug = slugify(v.city);
    const categorySlug = slugify(v.category);
    const key = `${citySlug}::${categorySlug}`;
    const entry = map.get(key) ?? {
      citySlug,
      categorySlug,
      category: v.category,
      verifiedCount: 0,
    };
    if (v.verified) entry.verifiedCount += 1;
    map.set(key, entry);
  }
  return Array.from(map.values()).filter((c) => c.verifiedCount >= minVerified);
}

/**
 * Villes ayant assez de prestataires vérifiés, toutes catégories confondues
 * (sert /[evenement]/[ville], qui montre l'annuaire complet de la ville —
 * même métrique que le garde-fou "belowThreshold" utilisé dans cette page,
 * pour ne jamais désynchroniser generateStaticParams et le rendu réel).
 */
export async function getIndexableCitySlugs(
  minVerified: number = MIN_VERIFIED_VENDORS
): Promise<string[]> {
  const vendors = await fetchVendorsCached();
  const counts = new Map<string, number>();
  for (const v of vendors) {
    if (!v.city || !v.verified) continue;
    const citySlug = slugify(v.city);
    counts.set(citySlug, (counts.get(citySlug) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count >= minVerified)
    .map(([citySlug]) => citySlug);
}

/**
 * Contenu éditorial écrit à la main pour une page ville×événement
 * (public.city_event_content). Contrairement au seuil de prestataires
 * vérifiés, ce contenu ne dépend PAS de l'annuaire : un texte unique et
 * substantiel justifie à lui seul de publier la page (voir échange sur le
 * contenu "thin" — le problème est le gabarit vide répété, pas l'absence
 * de prestataires sur une page par ailleurs réellement rédigée).
 */
export async function getCityEventContent(): Promise<
  { citySlug: string; eventTypeSlug: string; introText: string; imageUrl: string | null; imageAlt: string | null }[]
> {
  return fetchCityEventContentCached();
}

export async function getCityEventIntro(
  citySlug: string,
  eventTypeSlug: string
): Promise<string | null> {
  const content = await getCityEventContent();
  return (
    content.find((c) => c.citySlug === citySlug && c.eventTypeSlug === eventTypeSlug)
      ?.introText ?? null
  );
}

/**
 * Photo dédiée (+ alt text SEO ville×événement) rédigée à la main pour une
 * page ville×événement, même source que getCityEventIntro
 * (public.city_event_content.image_url / image_alt).
 */
export async function getCityEventImage(
  citySlug: string,
  eventTypeSlug: string
): Promise<{ url: string; alt: string } | null> {
  const content = await getCityEventContent();
  const entry = content.find((c) => c.citySlug === citySlug && c.eventTypeSlug === eventTypeSlug);
  return entry?.imageUrl ? { url: entry.imageUrl, alt: entry.imageAlt ?? "" } : null;
}

/**
 * Même principe que getCityEventContent, pour les pages ville×catégorie
 * (public.city_category_content). La catégorie y est stockée en toutes
 * lettres (comme public.vendors.category, pas de colonne slug dédiée) —
 * on la fait correspondre au slug de l'URL via slugify(), comme partout
 * ailleurs dans ce fichier.
 */
export async function getCityCategoryContent(): Promise<
  { citySlug: string; category: string; introText: string; imageUrl: string | null; imageAlt: string | null }[]
> {
  return fetchCityCategoryContentCached();
}

export async function getCityCategoryIntro(
  citySlug: string,
  categorySlug: string
): Promise<string | null> {
  const content = await getCityCategoryContent();
  return (
    content.find((c) => c.citySlug === citySlug && slugify(c.category) === categorySlug)
      ?.introText ?? null
  );
}

/**
 * Photo dédiée (+ alt text SEO ville×catégorie) rédigée à la main pour une
 * page ville×catégorie, même source que getCityCategoryIntro
 * (public.city_category_content.image_url / image_alt).
 */
export async function getCityCategoryImage(
  citySlug: string,
  categorySlug: string
): Promise<{ url: string; alt: string } | null> {
  const content = await getCityCategoryContent();
  const entry = content.find((c) => c.citySlug === citySlug && slugify(c.category) === categorySlug);
  return entry?.imageUrl ? { url: entry.imageUrl, alt: entry.imageAlt ?? "" } : null;
}

/**
 * Tous les slugs de catégorie de la vraie taxonomie (public.vendor_categories,
 * gérée en admin) — sert à distinguer un slug de catégorie bidon (404) d'une
 * catégorie réelle juste sans prestataire pour l'instant ("bientôt
 * disponible"). Volontairement PAS dérivé des prestataires déjà en base :
 * sinon, tant que l'annuaire est vide (ex. juste après un nettoyage des
 * fiches de démo), plus aucune catégorie n'est "connue" et toutes les pages
 * ville×catégorie renvoient un 404 au lieu du message d'attente.
 */
export async function getKnownCategorySlugs(): Promise<Map<string, string>> {
  return fetchKnownCategorySlugsCached();
}

/** Top 10 édité à la main pour une page ville×catégorie, trié par rang. */
export async function getCityCategoryPicks(
  citySlug: string,
  categorySlug: string
): Promise<DirectoryPick[]> {
  const picks = (await fetchCityCategoryPicksCached()) as (DirectoryPick & {
    category: string;
  })[];
  return picks.filter(
    (p) => p.city_slug === citySlug && slugify(p.category) === categorySlug
  );
}

/** Top 10 édité à la main pour une page ville×événement, trié par rang. */
export async function getCityEventPicks(
  citySlug: string,
  eventTypeSlug: string
): Promise<DirectoryPick[]> {
  const picks = (await fetchCityEventPicksCached()) as (DirectoryPick & {
    event_type_slug: string;
  })[];
  return picks.filter(
    (p) => p.city_slug === citySlug && p.event_type_slug === eventTypeSlug
  );
}

/**
 * Toutes les sélections "Top 10" (ville×catégorie ET ville×événement),
 * regroupées par clé "citySlug::categorySlug" (ou "citySlug::eventTypeSlug")
 * — sert l'outil de recherche (ExplorerClient), qui ne connaît que les
 * filtres catégorie/ville, pas les pages statiques individuelles.
 */
export async function getAllPicksByCombo(): Promise<Record<string, DirectoryPick[]>> {
  const [categoryPicks, eventPicks] = await Promise.all([
    fetchCityCategoryPicksCached() as Promise<(DirectoryPick & { category: string })[]>,
    fetchCityEventPicksCached() as Promise<(DirectoryPick & { event_type_slug: string })[]>,
  ]);
  const byCombo: Record<string, DirectoryPick[]> = {};
  for (const p of categoryPicks) {
    const key = `${p.city_slug}::${slugify(p.category)}`;
    (byCombo[key] ??= []).push(p);
  }
  for (const p of eventPicks) {
    const key = `${p.city_slug}::${p.event_type_slug}`;
    (byCombo[key] ??= []).push(p);
  }
  for (const key in byCombo) byCombo[key].sort((a, b) => a.rank - b.rank);
  return byCombo;
}

/**
 * Combinaisons ville×catégorie ayant un Top 10 édité, pour
 * generateStaticParams — sans ça, une page dont la seule justification est
 * le Top 10 (pas de prestataire vérifié, pas de contenu éditorial classique)
 * ne serait générée qu'au premier accès (ISR), jamais en avance.
 */
export async function getCityCategoryPickCombos(): Promise<
  { citySlug: string; categorySlug: string }[]
> {
  const picks = (await fetchCityCategoryPicksCached()) as (DirectoryPick & {
    category: string;
  })[];
  const seen = new Set<string>();
  const combos: { citySlug: string; categorySlug: string }[] = [];
  for (const p of picks) {
    const categorySlug = slugify(p.category);
    const key = `${p.city_slug}::${categorySlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    combos.push({ citySlug: p.city_slug, categorySlug });
  }
  return combos;
}

/** Même principe que getCityCategoryPickCombos, pour les pages ville×événement. */
export async function getCityEventPickCombos(): Promise<
  { citySlug: string; eventTypeSlug: string }[]
> {
  const picks = (await fetchCityEventPicksCached()) as (DirectoryPick & {
    event_type_slug: string;
  })[];
  const seen = new Set<string>();
  const combos: { citySlug: string; eventTypeSlug: string }[] = [];
  for (const p of picks) {
    const key = `${p.city_slug}::${p.event_type_slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    combos.push({ citySlug: p.city_slug, eventTypeSlug: p.event_type_slug });
  }
  return combos;
}
