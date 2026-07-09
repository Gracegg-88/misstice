import PlanningClient from "@/components/dashboard/PlanningClient";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCurrentEvent } from "@/lib/queries";
import { getPlanning } from "@/lib/dashboard";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";

export default async function PlanningPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <EmptyState message="Créez un événement pour préparer son planning." />
    );
  }

  const [moments, access] = await Promise.all([
    getPlanning(event.id),
    getEventAccess(event.id),
  ]);

  return (
    <PlanningClient
      key={event.id}
      eventId={event.id}
      initial={moments}
      eventName={event.name}
      eventDate={event.event_date}
      canEdit={canEditSection(access, "planning")}
    />
  );
}
