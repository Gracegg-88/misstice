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
    supabase
      .from("events")
      .select("invitation_card_url, share_token")
      .eq("id", event.id)
      .maybeSingle(),
  ]);
  const meta =
    (cardRes.data as {
      invitation_card_url: string | null;
      share_token: string | null;
    } | null) ?? null;

  return (
    <InvitesClient
      key={event.id}
      eventId={event.id}
      eventName={event.name}
      initial={guests}
      cardUrl={meta?.invitation_card_url ?? null}
      shareToken={meta?.share_token ?? null}
      canEdit={canEditSection(access, "invites")}
    />
  );
}
