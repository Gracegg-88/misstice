import EmptyState from "@/components/dashboard/EmptyState";
import InvitesClient from "@/components/dashboard/InvitesClient";
import { getCurrentEvent } from "@/lib/queries";
import { getGuests } from "@/lib/dashboard";
import { getEventAccess, canEditSection } from "@/lib/permissions-server";
import { createClient } from "@/lib/supabase/server";

export default async function InvitesPage() {
  const event = await getCurrentEvent();

  if (!event) {
    return <EmptyState message="Créez un événement pour gérer vos invités." />;
  }

  const supabase = createClient();
  const [guests, access, cardRes] = await Promise.all([
    getGuests(event.id),
    getEventAccess(event.id),
    supabase.from("events").select("invitation_card_url").eq("id", event.id).maybeSingle(),
  ]);
  const cardUrl =
    (cardRes.data as { invitation_card_url: string | null } | null)
      ?.invitation_card_url ?? null;

  return (
    <InvitesClient
      key={event.id}
      eventId={event.id}
      eventName={event.name}
      initial={guests}
      cardUrl={cardUrl}
      canEdit={canEditSection(access, "invites")}
    />
  );
}
