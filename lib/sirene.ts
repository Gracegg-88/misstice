// Import de fiches vitrines depuis l'API publique du gouvernement
// (recherche-entreprises.api.gouv.fr — même API que app/api/vendor/siret,
// gratuite, sans clé). Utilisé uniquement par les routes admin
// app/api/admin/sirene/*, jamais côté client.

export const GOUV_SEARCH_API = "https://recherche-entreprises.api.gouv.fr/search";

// Codes NAF/APE pertinents pour chaque catégorie Misstice (public.vendor_categories.name,
// rapprochement par égalité de chaîne exacte — vendors.category est du texte libre,
// pas une FK). Liste de départ volontairement restreinte aux catégories citées et aux
// codes les plus fiables ; à compléter au fur et à mesure (simple objet, pas de migration).
export const CATEGORY_NAF_CODES: Record<string, string[]> = {
  "Traiteur": ["56.21Z"],
  "Photographe": ["74.20Z"],
  "Fleuriste": ["47.76Z"],
  "Wedding/Event planner": ["82.30Z"],
  // "Salle de réception" / "Lieu de réception" : code incertain (souvent déclaré sous
  // location immobilière 68.20B ou organisation d'événements 82.30Z selon la structure)
  // — à vérifier sur un premier scan réel avant de l'activer ici.
};

/**
 * Catégorie juridique renvoyée par l'API (nomenclature INSEE) : les codes commençant
 * par "1" désignent une personne physique (1000 = Entrepreneur individuel — la
 * micro-entreprise est un régime fiscal appliqué à un EI, pas une catégorie juridique
 * distincte). Les personnes morales (SARL, SAS, SASU, SA...) sont codées "2xxx" et plus.
 * Filtre volontairement large (par préfixe) plutôt qu'une énumération de codes qu'on
 * pourrait mal recopier.
 */
export function isCompanyLegalForm(categorieJuridique: string | null | undefined): boolean {
  if (!categorieJuridique) return false;
  return !categorieJuridique.startsWith("1");
}

export type GouvEtablissement = {
  siret?: string;
  etat_administratif?: string;
  libelle_commune?: string;
  code_commune?: string;
};

export type GouvResult = {
  siren?: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  categorie_juridique?: string;
  siege?: GouvEtablissement;
  matching_etablissements?: GouvEtablissement[];
};

export type GouvSearchResponse = {
  results?: GouvResult[];
  total_results?: number;
};

/** Un petit délai entre appels : l'API n'a pas de clé/quota documenté dans ce repo,
 * mais reste une ressource publique mutualisée — on ne veut pas la marteler. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ImportCandidate = {
  name: string;
  siret: string;
  city: string;
};

/** Extrait un candidat importable d'un résultat gouv.fr, ou null s'il faut l'ignorer
 * (forme juridique EI/micro, établissement fermé, ville absente). Ne lit/n'invente
 * aucune photo ni description — seulement les champs factuels de l'API. */
export function toImportCandidate(result: GouvResult): ImportCandidate | null {
  if (!isCompanyLegalForm(result.categorie_juridique)) return null;
  const etab =
    result.siege?.etat_administratif === "A"
      ? result.siege
      : result.matching_etablissements?.find((e) => e.etat_administratif === "A");
  if (!etab?.siret || !etab.libelle_commune) return null;
  const name = result.nom_complet?.trim() || result.nom_raison_sociale?.trim();
  if (!name) return null;
  return { name, siret: etab.siret, city: etab.libelle_commune };
}
