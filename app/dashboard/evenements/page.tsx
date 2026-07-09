import { cookies } from "next/headers";
import EmptyState from "@/components/dashboard/EmptyState";
import EventsManagerClient from "@/components/dashboard/EventsManagerClient";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/queries";

export type ManagedEvent = {
  id: string;
  owner_id: string;
  name: string;
  type: string | null;
  event_date: string | null;
  guest_count: number;
  isOwner: boolean;
};

export default async function DashboardEventsPage() {
  if (!isSupabaseConfigured()) {
    return <EmptyState message="Connectez-vous pour gérer vos événements." />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <EmptyState message="Connectez-vous pour gérer vos événements." />;
  }

  // Le RLS (can_access_event) inclut les événements où l'on est membre accepté.
  const { data } = await supabase
    .from("events")
    .select("id, owner_id, name, type, event_date, guest_count")
    .order("created_at", { ascending: false });

  const events: ManagedEvent[] = ((data as Omit<ManagedEvent, "isOwner">[]) ?? []).map(
    (e) => ({ ...e, isOwner: e.owner_id === user.id })
  );

  if (events.length === 0) {
    return (
      <EmptyState message="Aucun événement pour le moment. Créez votre premier événement." />
    );
  }

  const currentId = cookies().get("current_event_id")?.value ?? events[0].id;

  return <EventsManagerClient initial={events} currentId={currentId} />;
}
