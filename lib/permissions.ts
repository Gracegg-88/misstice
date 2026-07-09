// Constantes / types / fonctions PURES — importables côté client ET serveur.
// (La récupération d'accès qui dépend de Supabase serveur vit dans
//  lib/permissions-server.ts pour ne pas tirer next/headers dans le client.)

// Sections d'un événement pouvant être déléguées à un collaborateur.
// La clé correspond à `can_edit_section(event, key)` côté SQL.
export const EVENT_SECTIONS = [
  { key: "budget", label: "Budget" },
  { key: "checklist", label: "Checklist" },
  { key: "invites", label: "Invités" },
  { key: "prestataires", label: "Prestataires" },
  { key: "planning", label: "Planning Jour J" },
  { key: "inspiration", label: "Inspiration" },
] as const;

export type SectionKey = (typeof EVENT_SECTIONS)[number]["key"];

export type EventAccess = {
  isOwner: boolean;
  permissions: string[];
};

/** Vrai si l'utilisateur peut MODIFIER la section donnée. */
export function canEditSection(access: EventAccess, section: SectionKey): boolean {
  return access.isOwner || access.permissions.includes(section);
}
