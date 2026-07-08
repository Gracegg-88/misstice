import EmptyState from "@/components/dashboard/EmptyState";
import InvitesClient from "@/components/dashboard/InvitesClient";
import { getCurrentEvent } from "@/lib/queries";
import { getGuests } from "@/lib/dashboard";

export default async function InvitesPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return <EmptyState message="Créez un événement pour gérer vos invités." />;
  }

  const guests = await getGuests(event.id);

  return (
    <InvitesClient key={event.id} eventId={event.id} eventName={event.name} initial={guests} />
  );
}
