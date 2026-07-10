import EmptyState from "@/components/dashboard/EmptyState";
import EquipeClient from "@/components/dashboard/EquipeClient";
import { getCurrentEvent } from "@/lib/queries";
import { getTeam } from "@/lib/dashboard";
import { getEventAccess } from "@/lib/permissions-server";
import { createClient } from "@/lib/supabase/server";

export default async function EquipePage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <EmptyState message="Créez un événement pour inviter votre équipe." />
    );
  }

  const supabase = createClient();
  const [team, access, orgRes] = await Promise.all([
    getTeam(event.id),
    getEventAccess(event.id),
    supabase.rpc("event_organizer", { p_event: event.id }),
  ]);
  const orgRow = (orgRes.data as { full_name: string | null; email: string }[] | null)?.[0];
  const organizer = orgRow
    ? { name: orgRow.full_name?.trim() || "Organisateur", email: orgRow.email }
    : null;

  return (
    <EquipeClient
      key={event.id}
      eventId={event.id}
      eventName={event.name}
      initial={team}
      isOwner={access.isOwner}
      organizer={organizer}
    />
  );
}
