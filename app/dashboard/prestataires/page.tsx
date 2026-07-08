import EmptyState from "@/components/dashboard/EmptyState";
import BookedVendorsClient from "@/components/dashboard/BookedVendorsClient";
import { getCurrentEvent } from "@/lib/queries";
import { getEventVendors } from "@/lib/dashboard";

export default async function DashboardVendorsPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return (
      <EmptyState message="Créez un événement pour suivre vos prestataires." />
    );
  }

  const vendors = await getEventVendors(event.id);

  return <BookedVendorsClient key={event.id} eventId={event.id} initial={vendors} />;
}
