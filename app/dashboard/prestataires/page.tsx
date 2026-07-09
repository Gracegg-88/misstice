import VendorsTabs from "@/components/dashboard/VendorsTabs";
import { getCurrentEvent } from "@/lib/queries";
import { getEventVendors } from "@/lib/dashboard";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";

export default async function DashboardVendorsPage() {
  const event = await getCurrentEvent();
  const vendors = event ? await getEventVendors(event.id) : [];
  const canEdit = event
    ? canEditSection(await getEventAccess(event.id), "prestataires")
    : true;

  return (
    <VendorsTabs eventId={event?.id ?? null} initial={vendors} canEdit={canEdit} />
  );
}
