import { createClient } from "@/lib/supabase/server";
import type {
  ChecklistTask,
  Guest,
  EventVendor,
  PlanningMoment,
  VendorCall,
  InspirationIdea,
  TeamMember,
  ReceivedQuote,
  GiftItem,
  SeatingTable,
  SeatingSeat,
} from "@/lib/dashboard-types";

// Ré-export pour compatibilité (les composants client importent plutôt depuis
// "@/lib/dashboard-types" pour ne pas tirer ce module serveur dans le bundle).
export type {
  ChecklistTask,
  Guest,
  EventVendor,
  PlanningMoment,
  VendorCall,
  InspirationIdea,
  TeamMember,
} from "@/lib/dashboard-types";

// ── Requêtes (serveur) ───────────────────────────────────────────────────────

export async function getChecklist(eventId: string): Promise<ChecklistTask[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("checklist_tasks")
    .select("id, event_id, label, assignee, due_date, done, position")
    .eq("event_id", eventId)
    .order("done", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as ChecklistTask[]) ?? [];
}

export async function getGuests(eventId: string): Promise<Guest[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("guests")
    .select("id, event_id, name, email, phone, diet, group_label, status, plus_one")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data as Guest[]) ?? [];
}

export async function getEventVendors(eventId: string): Promise<EventVendor[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("event_vendors")
    .select("id, event_id, vendor_id, name, category, status, price, vendors(image)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  type Row = Omit<EventVendor, "image"> & {
    vendors?: { image: string | null } | { image: string | null }[] | null;
  };
  return ((data as unknown as Row[]) ?? []).map((r) => {
    const v = Array.isArray(r.vendors) ? r.vendors[0] : r.vendors;
    return { ...r, image: v?.image ?? null };
  });
}

// Devis reçus par le particulier connecté (via ses conversations). Le RLS
// (quotes_select) filtre aux conversations dont il est participant. On exclut
// les devis qu'il aurait lui-même émis (compte à double rôle).
export async function getReceivedQuotes(): Promise<ReceivedQuote[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("quotes")
    .select(
      "id, conversation_id, presta_name, presta_category, amount, status, quote_number, created_at"
    )
    .neq("prestataire_id", user.id)
    .order("created_at", { ascending: false });
  return (data as ReceivedQuote[]) ?? [];
}

export async function getPlanning(eventId: string): Promise<PlanningMoment[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("planning_moments")
    .select("id, event_id, start_time, duration, title, description, place, who, vendor, color, position")
    .eq("event_id", eventId)
    .order("position", { ascending: true })
    .order("start_time", { ascending: true });
  return (data as PlanningMoment[]) ?? [];
}

export async function getVendorCalls(eventId: string): Promise<VendorCall[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendor_calls")
    .select("id, event_id, vendor, scheduled_at, mode")
    .eq("event_id", eventId)
    .order("scheduled_at", { ascending: true });
  return (data as VendorCall[]) ?? [];
}

export async function getGiftItems(eventId: string): Promise<GiftItem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("gift_items")
    .select("id, event_id, title, url, price, note, reserved, position")
    .eq("event_id", eventId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as GiftItem[]) ?? [];
}

export async function getSeatingTables(
  eventId: string
): Promise<SeatingTable[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("seating_tables")
    .select("id, event_id, name, capacity, position")
    .eq("event_id", eventId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  return (data as SeatingTable[]) ?? [];
}

export async function getSeatingSeats(
  eventId: string
): Promise<SeatingSeat[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("seating_seats")
    .select("id, event_id, table_id, name, position")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data as SeatingSeat[]) ?? [];
}

export async function getInspiration(eventId: string): Promise<InspirationIdea[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("inspiration_ideas")
    .select("id, event_id, title, category, tags, image_url, source, source_url, liked, media_type")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return (data as InspirationIdea[]) ?? [];
}

export async function getTeam(eventId: string): Promise<TeamMember[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("event_members")
    .select("id, event_id, email, role, permissions, user_id, status")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data as TeamMember[]) ?? [];
}
