import EmptyState from "@/components/dashboard/EmptyState";
import EquipeClient from "@/components/dashboard/EquipeClient";
import { getCurrentEvent } from "@/lib/queries";
import { getTeam } from "@/lib/dashboard";

export default async function EquipePage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <EmptyState message="Créez un événement pour inviter votre équipe." />
    );
  }

  const team = await getTeam(event.id);

  return (
    <EquipeClient key={event.id} eventId={event.id} eventName={event.name} initial={team} />
  );
}
