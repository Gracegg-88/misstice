import GiftListClient from "@/components/dashboard/GiftListClient";
import EmptyState from "@/components/dashboard/EmptyState";
import { getCurrentEvent } from "@/lib/queries";
import { getGiftItems } from "@/lib/dashboard";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";

export default async function CadeauxPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return <EmptyState message="Créez un événement pour gérer votre liste cadeau." />;
  }

  const [items, access] = await Promise.all([
    getGiftItems(event.id),
    getEventAccess(event.id),
  ]);

  return (
    <GiftListClient
      key={event.id}
      eventId={event.id}
      eventName={event.name}
      initial={items}
      canEdit={canEditSection(access, "cadeaux")}
    />
  );
}
