// Formatage de dates/heures partagé (fr-FR), pour éviter les doublons dispersés
// dans les composants de messagerie et de tableau de bord.

/** Heure courte : « 14:05 ». */
export function hourMinute(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Étiquette de jour relative pour séparer les messages :
 * « Aujourd'hui », « Hier », sinon « lundi 3 mars ».
 */
export function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === y.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
