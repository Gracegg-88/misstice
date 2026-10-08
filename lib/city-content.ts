import { CITY_EVENT_CONTENT_FILES } from "@/content/villes";

/**
 * Contenu éditorial des pages /[evenement]/[ville], séparé du modèle de
 * page : un fichier JSON par ville et par événement dans content/villes/
 * (voir content/villes/README.md). Aucune donnée n'est générée ici : un
 * champ vide reste vide, et la section correspondante n'est pas affichée.
 */

export type Lieu = {
  nom: string;
  type?: string;
  quartier?: string;
  capacite?: string;
  fourchette_prix?: string;
  convient_a?: string;
  conseil?: string;
};

export type FaqLocale = { question: string; reponse: string };
export type Source = { url: string; titre?: string; sujet?: string; consulte_le?: string };

/** Prestataire mis en avant à la main (section « 3 prestataires »). */
export type FeaturedVendorEntry = {
  role: string;
  prestataire_id: string;
  rang: number;
  /** 1 à 2 phrases rédigées à la main, jamais générées. */
  pourquoi: string;
  date_verification: string;
};

export type CityEventContentFile = {
  /**
   * Interrupteur de publication. Tant qu'il n'est pas à true : noindex,
   * absente du sitemap, aucun lien interne vers la page.
   */
  publier?: boolean;
  ville: string;
  evenement: string;
  angle_local?: string;
  saison_et_meteo?: string;
  lieux?: Lieu[];
  budget_local?: string;
  contraintes_pratiques?: string;
  specialites_locales?: string;
  faq_locale?: FaqLocale[];
  sources?: Source[];
  derniere_mise_a_jour?: string;
  prestataires_mis_en_avant?: FeaturedVendorEntry[];
  /** Notes de travail : jamais affichées (retirées dès le chargement). */
  notes_internes_a_ne_pas_afficher?: string[];
};

/** Même normalisation que slugify() (lib/geo.ts) : « Grenoble » → « grenoble ». */
function toSlug(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const filled = (s: string | undefined): s is string => !!s && s.trim().length > 0;

/** Normalise : retire les entrées vides pour que « rempli » ait un sens. */
function clean(c: CityEventContentFile): CityEventContentFile {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { notes_internes_a_ne_pas_afficher, ...rest } = c;
  return {
    ...rest,
    ville: toSlug(c.ville),
    evenement: toSlug(c.evenement),
    lieux: (c.lieux ?? []).filter((l) => filled(l.nom)),
    faq_locale: (c.faq_locale ?? []).filter((f) => filled(f.question) && filled(f.reponse)),
    sources: (c.sources ?? []).filter((s) => filled(s.url)),
    prestataires_mis_en_avant: (c.prestataires_mis_en_avant ?? []).filter(
      (p) => filled(p.prestataire_id) && filled(p.role) && filled(p.pourquoi)
    ),
  };
}

export function getCityEventContentFile(
  citySlug: string,
  eventTypeSlug: string
): CityEventContentFile | null {
  return (
    CITY_EVENT_CONTENT_FILES.map(clean).find(
      (c) => c.ville === citySlug && c.evenement === eventTypeSlug
    ) ?? null
  );
}

/** Sections prises en compte pour la règle d'indexation (hors intro). */
export function countFilledSections(c: CityEventContentFile): number {
  return [
    filled(c.saison_et_meteo),
    (c.lieux?.length ?? 0) > 0,
    filled(c.budget_local),
    filled(c.contraintes_pratiques),
    filled(c.specialites_locales),
    (c.faq_locale?.length ?? 0) > 0,
  ].filter(Boolean).length;
}

export const MIN_FILLED_SECTIONS = 3;

/**
 * Règle d'indexation des pages ville × événement : publiée seulement si la
 * fiche porte "publier": true. Garde-fou en plus : même avec publier à
 * true, une fiche sans intro locale ou avec moins de 3 sections remplies
 * reste non publiée. Non publiée = noindex, hors sitemap, et jamais de lien
 * interne vers la page.
 */
export function isCityEventIndexable(c: CityEventContentFile | null): boolean {
  return (
    !!c &&
    c.publier === true &&
    filled(c.angle_local) &&
    countFilledSections(c) >= MIN_FILLED_SECTIONS
  );
}

/** Combinaisons indexables (sitemap, liens depuis le guide et le hub ville). */
export function getIndexableCityEventCombos(): { citySlug: string; eventTypeSlug: string }[] {
  return CITY_EVENT_CONTENT_FILES.map(clean)
    .filter(isCityEventIndexable)
    .map((c) => ({ citySlug: c.ville, eventTypeSlug: c.evenement }));
}

/** Découpe un champ texte en paragraphes (séparés par une ligne vide). */
export function paragraphs(text: string | undefined): string[] {
  return (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Événements au féminin (« une baby shower ») ; tous les autres sont au masculin. */
const FEMININE_EVENTS = new Set(["baby-shower"]);

/**
 * Formes accordées du nom d'un type d'événement, à utiliser partout sur les
 * pages ville (titres, boutons, encadré « bientôt disponible ») :
 * label « Baby shower », name « baby shower », withArticle « une baby
 * shower », possessive « ma baby shower ».
 */
export function eventGrammar(eventType: { slug: string; name: string }) {
  const name = eventType.name.toLowerCase();
  const feminine = FEMININE_EVENTS.has(eventType.slug);
  return {
    name,
    label: name.charAt(0).toUpperCase() + name.slice(1),
    withArticle: `${feminine ? "une" : "un"} ${name}`,
    possessive: `${feminine ? "ma" : "mon"} ${name}`,
  };
}

/** Libellés lisibles des types de lieux (champ lieux[].type des fiches). */
const LIEU_TYPE_LABELS: Record<string, string> = {
  domicile: "À domicile",
  "restaurant-salon-de-the": "Salon de thé ou restaurant",
  "salon-de-the": "Salon de thé",
  restaurant: "Restaurant",
  salle: "Salle de réception",
};

/** « restaurant-salon-de-the » → « Salon de thé ou restaurant » ; type inconnu : tirets remplacés, majuscule initiale. */
export function lieuTypeLabel(type: string | undefined): string {
  const t = (type ?? "").trim();
  if (!t) return "";
  const known = LIEU_TYPE_LABELS[toSlug(t)];
  if (known) return known;
  const words = t.replace(/[-_]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Guide national correspondant à chaque type d'événement. */
export const EVENT_GUIDES: Record<string, { href: string; anchor: string }> = {
  mariage: { href: "/organiser-un-mariage", anchor: "guide complet pour organiser un mariage" },
  anniversaire: { href: "/organiser-un-anniversaire", anchor: "guide complet pour organiser un anniversaire" },
  bapteme: { href: "/organiser-un-bapteme", anchor: "guide complet pour organiser un baptême" },
  gala: { href: "/organiser-un-evenement-professionnel", anchor: "guide complet pour organiser un gala ou un événement professionnel" },
  "baby-shower": { href: "/organiser-une-baby-shower", anchor: "guide complet pour organiser une baby shower" },
};

/**
 * Rôles essentiels par type d'événement (section « 3 prestataires »).
 * `categories` = noms exacts de public.vendor_categories acceptés pour ce
 * rôle : un prestataire mis en avant dont la catégorie ne correspond pas
 * n'est pas affiché.
 */
export const ESSENTIAL_ROLES: Record<string, { role: string; label: string; categories: string[] }[]> = {
  "baby-shower": [
    { role: "traiteur", label: "Traiteur", categories: ["Traiteur"] },
    { role: "patissier", label: "Pâtissier", categories: ["Pâtissier", "Pâtissier / Wedding cake"] },
    { role: "decorateur", label: "Décorateur", categories: ["Décoration"] },
  ],
};
