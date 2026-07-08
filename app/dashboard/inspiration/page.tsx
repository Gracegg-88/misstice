import EmptyState from "@/components/dashboard/EmptyState";
import InspirationClient from "@/components/dashboard/InspirationClient";
import { getCurrentEvent } from "@/lib/queries";
import { getInspiration } from "@/lib/dashboard";

export default async function InspirationPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <EmptyState message="Créez un événement pour rassembler vos inspirations." />
    );
  }

  const initial = await getInspiration(event.id);

  return <InspirationClient key={event.id} eventId={event.id} initial={initial} />;
}
