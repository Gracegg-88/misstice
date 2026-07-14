import { createClient } from "@/lib/supabase/server";

// Un fil « Équipe » = la discussion de groupe d'un événement.
export type TeamThread = {
  eventId: string;
  eventName: string;
  lastBody: string | null;
  lastAt: string;
  unread: number;
};

export type TeamMessage = {
  id: string;
  event_id: string;
  sender_id: string;
  sender_name: string | null;
  sender_avatar: string | null;
  body: string;
  created_at: string;
};

type ThreadRow = {
  event_id: string;
  event_name: string;
  last_body: string | null;
  last_at: string;
  unread: number;
};

/** Fils d'équipe de l'utilisateur (un par événement où il collabore). */
export async function getMyTeamThreads(): Promise<TeamThread[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("my_team_threads");
  if (error) console.error("team-chat:", error.message);
  return ((data as ThreadRow[]) ?? [])
    .map((r) => ({
      eventId: r.event_id,
      eventName: r.event_name,
      lastBody: r.last_body,
      lastAt: r.last_at,
      unread: Number(r.unread),
    }))
    .sort((a, b) => (a.lastAt < b.lastAt ? 1 : -1));
}

/** Total des messages d'équipe non lus (pour le badge de la sidebar). */
export async function getTeamUnreadTotal(): Promise<number> {
  const threads = await getMyTeamThreads();
  return threads.reduce((s, t) => s + t.unread, 0);
}

/** Un fil d'équipe : nom de l'événement, mes infos et messages. */
export async function getTeamThread(
  eventId: string
): Promise<{ eventName: string; userId: string; initial: TeamMessage[] } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Le RLS de events limite déjà la lecture aux membres → maybeSingle null = pas d'accès.
  const { data: event, error: eventErr } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .maybeSingle();
  if (eventErr) console.error("team-chat:", eventErr.message);
  if (!event) return null;

  const { data: msgs, error: msgErr } = await supabase
    .from("team_messages")
    .select("id, event_id, sender_id, sender_name, sender_avatar, body, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  if (msgErr) console.error("team-chat:", msgErr.message);

  return {
    eventName: (event as { name: string }).name,
    userId: user.id,
    initial: (msgs as TeamMessage[]) ?? [],
  };
}
