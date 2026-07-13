// Limiteur de débit simple, en mémoire (fenêtre glissante).
// NB : la mémoire est par-instance serverless → protection best-effort contre
// l'abus (spam d'emails, proxy média), pas une garantie distribuée.
const buckets = new Map<string, number[]>();

/**
 * @returns true si l'appel est autorisé, false s'il dépasse la limite.
 * @param key    identifiant (ex. `notify:<userId>`)
 * @param max    nombre max d'appels dans la fenêtre
 * @param windowMs durée de la fenêtre en ms
 */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // Nettoyage opportuniste pour éviter une croissance illimitée de la Map.
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return true;
}
