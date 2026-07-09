import VendorsTabs from "@/components/dashboard/VendorsTabs";
import { getCurrentEvent } from "@/lib/queries";
import { getEventVendors } from "@/lib/dashboard";

export default async function DashboardVendorsPage() {
  const event = await getCurrentEvent();
  const vendors = event ? await getEventVendors(event.id) : [];

  return <VendorsTabs eventId={event?.id ?? null} initial={vendors} />;
}
