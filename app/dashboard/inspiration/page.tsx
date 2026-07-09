import EmptyState from "@/components/dashboard/EmptyState";
import InspirationClient from "@/components/dashboard/InspirationClient";
import { getCurrentEvent } from "@/lib/queries";
import { getInspiration } from "@/lib/dashboard";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";

export default async function InspirationPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <EmptyState message="Créez un événement pour rassembler vos inspirations." />
    );
  }

  const [initial, access] = await Promise.all([
    getInspiration(event.id),
    getEventAccess(event.id),
  ]);

  return (
    <InspirationClient
      key={event.id}
      eventId={event.id}
      initial={initial}
      canEdit={canEditSection(access, "inspiration")}
    />
  );
}
