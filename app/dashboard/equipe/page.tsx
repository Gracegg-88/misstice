import EmptyState from "@/components/dashboard/EmptyState";
import EquipeClient from "@/components/dashboard/EquipeClient";
import { getCurrentEvent } from "@/lib/queries";
import { getTeam } from "@/lib/dashboard";
import { getEventAccess } from "@/lib/permissions-server";

export default async function EquipePage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <EmptyState message="Créez un événement pour inviter votre équipe." />
    );
  }

  const [team, access] = await Promise.all([
    getTeam(event.id),
    getEventAccess(event.id),
  ]);

  return (
    <EquipeClient
      key={event.id}
      eventId={event.id}
      eventName={event.name}
      initial={team}
      isOwner={access.isOwner}
    />
  );
}
