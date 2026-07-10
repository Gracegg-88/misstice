import VendorsTabs from "@/components/dashboard/VendorsTabs";
import { getCurrentEvent } from "@/lib/queries";
import { getEventVendors, getReceivedQuotes } from "@/lib/dashboard";
import { getMyConversations } from "@/lib/messaging";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";

export default async function DashboardVendorsPage() {
  const event = await getCurrentEvent();
  const [vendors, quotes, conversations] = await Promise.all([
    event ? getEventVendors(event.id) : Promise.resolve([]),
    getReceivedQuotes(),
    getMyConversations(),
  ]);
  const canEdit = event
    ? canEditSection(await getEventAccess(event.id), "prestataires")
    : true;

  // vendor_id → conversation (pour « Contacter » → ouvre la discussion).
  const convByVendor: Record<string, string> = {};
  for (const c of conversations) {
    if (c.role === "particulier" && c.vendor_id && !convByVendor[c.vendor_id]) {
      convByVendor[c.vendor_id] = c.id;
    }
  }

  return (
    <VendorsTabs
      eventId={event?.id ?? null}
      initial={vendors}
      quotes={quotes}
      convByVendor={convByVendor}
      canEdit={canEdit}
    />
  );
}
