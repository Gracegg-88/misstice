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
  const supabase = db();
  const { data } = await supabase.from("cities").select("slug, name, region").order("name");
  return (data as City[]) ?? [];
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  const cities = await getCities();
  return cities.find((c) => c.slug === slug) ?? null;
}

export async function getEventTypes(): Promise<EventType[]> {
  const supabase = db();
  const { data } = await supabase
    .from("event_types")
    .select("slug, name")
    .order("position");
  return (data as EventType[]) ?? [];
}

export async function getEventTypeBySlug(slug: string): Promise<EventType | null> {
  const types = await getEventTypes();
  return types.find((t) => t.slug === slug) ?? null;
}

/** Prestataires d'une ville (tous, vérifiés ou non — comme l'annuaire /prestataires). */
export async function getVendorsForCity(citySlug: string): Promise<Vendor[]> {
  const vendors = await getVendors(db());
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
  const vendors = await getVendors(db());
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
  const vendors = await getVendors(db());
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
  const vendors = await getVendors(db());
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
  { citySlug: string; eventTypeSlug: string; introText: string }[]
> {
  const supabase = db();
  const { data } = await supabase
    .from("city_event_content")
    .select("city_slug, event_type_slug, intro_text");
  return (
    (data as { city_slug: string; event_type_slug: string; intro_text: string }[] | null) ?? []
  ).map((r) => ({ citySlug: r.city_slug, eventTypeSlug: r.event_type_slug, introText: r.intro_text }));
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
 * Tous les slugs de catégorie de la vraie taxonomie (public.vendor_categories,
 * gérée en admin) — sert à distinguer un slug de catégorie bidon (404) d'une
 * catégorie réelle juste sans prestataire pour l'instant ("bientôt
 * disponible"). Volontairement PAS dérivé des prestataires déjà en base :
 * sinon, tant que l'annuaire est vide (ex. juste après un nettoyage des
 * fiches de démo), plus aucune catégorie n'est "connue" et toutes les pages
 * ville×catégorie renvoient un 404 au lieu du message d'attente.
 */
export async function getKnownCategorySlugs(): Promise<Map<string, string>> {
  const supabase = db();
  const { data } = await supabase.from("vendor_categories").select("name");
  const map = new Map<string, string>();
  for (const c of (data as { name: string }[] | null) ?? []) {
    map.set(slugify(c.name), c.name);
  }
  return map;
}
