// Fonctions pures (programme pilote / membres fondateurs), sans dépendance
// serveur — importables depuis un composant client (ProfilClient.tsx).
// Les requêtes Supabase (lib/pilot.ts) restent côté serveur.

export type PilotStatus = {
  foundingMember: boolean;
  pilotMember: boolean;
  pilotPackProUntil: string | null;
};

/** Le Pack Pro gratuit (programme pilote) de ce prestataire est-il actif
 *  aujourd'hui ? (indépendant de founding_member, qui ne porte que sur les
 *  photos). */
export function isPilotPackProActive(v: PilotStatus): boolean {
  if (!v.pilotMember || !v.pilotPackProUntil) return false;
  return new Date(`${v.pilotPackProUntil}T23:59:59`) >= new Date();
}

/** Peut-il ajouter une photo/vidéo de plus à son book ? Membre fondateur :
 *  toujours oui. Pilote actif : toujours oui (le temps du programme). Sinon :
 *  sous la limite gratuite. Revérifié côté base (vendor-photos trigger) —
 *  cette fonction sert à l'affichage, pas de garde-fou de sécurité à elle
 *  seule. */
/** Accès Pack Pro aujourd'hui : pilote actif, ou abonné (PR2a — pas encore
 *  construit, toujours false pour l'instant). Les membres fondateurs n'ont
 *  PAS automatiquement accès au Pack Pro par ce seul statut : ce flag ne
 *  porte que sur la limite de photos (voir canUploadMorePhotos). */
export function hasPackProAccess(v: PilotStatus): boolean {
  return isPilotPackProActive(v);
}

export function canUploadMorePhotos(
  v: PilotStatus,
  currentPhotoCount: number,
  freeTierPhotoLimit: number
): boolean {
  if (v.foundingMember) return true;
  if (isPilotPackProActive(v)) return true;
  return currentPhotoCount < freeTierPhotoLimit;
}
