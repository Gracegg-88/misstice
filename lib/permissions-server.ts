import { createClient } from "@/lib/supabase/server";
import type { EventAccess } from "@/lib/permissions";

// Re-export pour permettre aux pages serveur d'importer les deux d'un seul endroit.
export { canEditSection } from "@/lib/permissions";
export type { EventAccess, SectionKey } from "@/lib/permissions";

/**
 * Accès de l'utilisateur courant à un événement :
 *  - propriétaire → peut tout modifier ;
 *  - membre accepté → peut modifier les sections listées dans `permissions`.
 * Renvoie `{ isOwner: false, permissions: [] }` si non concerné (lecture seule).
 * SERVEUR uniquement (dépend de next/headers via le client Supabase serveur).
 */
export async function getEventAccess(eventId: string): Promise<EventAccess> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isOwner: false, permissions: [] };

  const { data: ev } = await supabase
    .from("events")
    .select("owner_id")
    .eq("id", eventId)
    .maybeSingle();
  if ((ev as { owner_id: string } | null)?.owner_id === user.id) {
    return { isOwner: true, permissions: [] };
  }

  const { data: member } = await supabase
    .from("event_members")
    .select("permissions")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  return {
    isOwner: false,
    permissions: ((member as { permissions: string[] } | null)?.permissions) ?? [],
  };
}
