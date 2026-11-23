import { REGION_CONTENT_FILES } from "@/content/regions";
import type { FaqLocale, Source } from "@/lib/city-content";

/**
 * Contenu éditorial des pages hub de région (/region/{region}), rédigé à la
 * main dans content/regions/<region>.json (voir content/regions/README.md).
 * Rien n'est généré : un champ vide n'est pas affiché, et la page reste en
 * noindex tant qu'aucun texte rédigé n'est publié.
 */
export type RegionContentFile = {
  /** Interrupteur de publication : noindex et hors sitemap tant qu'il n'est pas à true. */
  publier?: boolean;
  /** Nom de la région tel qu'en base (cities.region), ex. « Auvergne-Rhône-Alpes ». */
  region: string;
  introduction?: string;
  traditions_et_coutumes?: string;
  lieux_de_reception_typiques?: string;
  meilleure_saison?: string;
  specialites_culinaires?: string;
  budget_moyen?: string;
  faq?: FaqLocale[];
  sources?: Source[];
  derniere_mise_a_jour?: string;
  /** Notes de travail : jamais affichées. */
  notes_internes_a_ne_pas_afficher?: string[];
};

const filled = (s: string | undefined) => !!s && s.trim().length > 0;

const toSlug = (input: string) =>
  input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function regionSlug(region: string): string {
  return toSlug(region);
}

export function getRegionContentFile(slug: string): RegionContentFile | null {
  const file = REGION_CONTENT_FILES.find((r) => toSlug(r.region) === slug);
  if (!file) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notes_internes_a_ne_pas_afficher, ...rest } = file;
  return {
    ...rest,
    faq: (file.faq ?? []).filter((f) => filled(f.question) && filled(f.reponse)),
    sources: (file.sources ?? []).filter((s) => filled(s.url)),
  };
}

/** Une page région n'est indexée que si un texte rédigé est publié. */
export function isRegionIndexable(c: RegionContentFile | null): boolean {
  return !!c && c.publier === true && filled(c.introduction);
}
