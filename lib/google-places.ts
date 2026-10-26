// Recherche du place_id Google d'un prestataire (serveur uniquement).
//
// Conformité Google Maps Platform (voir docs/google-places.md) :
//  - seul le place_id est stocké (autorisé sans limite de durée) ;
//  - la recherche utilise Text Search (New) avec le masque « places.id »
//    → SKU « Text Search Essentials (IDs Only) », gratuit et illimité, et
//    aucun contenu Places (nom, note, avis…) ne transite par notre serveur ;
//  - la note est affichée en direct par le Places UI Kit côté navigateur
//    (components/google/GooglePlaceCard.tsx), jamais copiée en base.
// La clé GOOGLE_PLACES_API_KEY ne quitte jamais le serveur.

const TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";

/** Format d'un place_id Google (alphanumérique, tirets et soulignés). */
export function isValidPlaceId(id: unknown): id is string {
  return typeof id === "string" && /^[A-Za-z0-9_-]{10,300}$/.test(id);
}

/**
 * Jusqu'à 5 place_id candidats pour une requête texte (ex. « Nom Ville »).
 * Lève une erreur si la clé n'est pas configurée ou si Google répond en erreur.
 */
export async function searchPlaceIds(query: string): Promise<string[]> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY manquante.");
  const textQuery = query.replace(/\s+/g, " ").trim().slice(0, 200);
  if (!textQuery) return [];

  const res = await fetch(TEXT_SEARCH_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      // IDs uniquement : SKU gratuit, aucun contenu Places récupéré.
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "fr",
      regionCode: "FR",
      pageSize: 5,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Recherche Google impossible (${res.status}).`);
  }
  const data = (await res.json().catch(() => ({}))) as { places?: { id?: string }[] };
  return (data.places ?? [])
    .map((p) => p.id)
    .filter(isValidPlaceId)
    .slice(0, 5);
}

/**
 * Vérifie qu'un place_id est toujours valable (Google recommande de rafraîchir
 * les identifiants de plus de 12 mois). Place Details avec le masque « id »
 * → SKU « Place Details Essentials (IDs Only) », gratuit et illimité.
 * Renvoie l'identifiant à jour, ou null si la fiche Google n'existe plus.
 */
export async function refreshPlaceId(placeId: string): Promise<string | null> {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY manquante.");
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "id" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Vérification Google impossible (${res.status}).`);
  const data = (await res.json().catch(() => ({}))) as { id?: string };
  return isValidPlaceId(data.id) ? data.id : placeId;
}
