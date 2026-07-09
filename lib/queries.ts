import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Vrai si les variables d'environnement Supabase sont renseignées. */
export function isSupabaseConfigured(): boolean {
  return (
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export type Profile = {
  id: string;
  full_name: string | null;
  role: "particulier" | "prestataire" | "admin";
  avatar_url: string | null;
  can_manage_admins: boolean;
};

export type AdminStats = {
  users: number;
  families: number;
  vendors: number;
  events: number;
  pendingVerification: number;
};

export type EventRow = {
  id: string;
  owner_id: string;
  name: string;
  type: string | null;
  event_date: string | null;
  budget_total: number;
  guest_count: number;
};

export type BudgetCategory = {
  id: string;
  event_id: string;
  name: string;
  budget: number;
  color: string;
  position: number;
  spent: number;
};

/** Profil de l'utilisateur connecté (ou null). */
export async function getProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, can_manage_admins")
    .eq("id", user.id)
    .single();

  return (data as Profile) ?? null;
}

export type EventListItem = {
  id: string;
  name: string;
  event_date: string | null;
};

/** Événements accessibles à l'utilisateur (possédés OU partagés), récents d'abord. */
export async function getUserEvents(): Promise<EventListItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Pas de filtre owner_id : le RLS (can_access_event) inclut déjà les
  // événements où l'utilisateur est membre accepté (collaboration).
  const { data } = await supabase
    .from("events")
    .select("id, name, event_date")
    .order("created_at", { ascending: false });

  return (data as EventListItem[]) ?? [];
}

/**
 * Événement courant : celui sélectionné (cookie `current_event_id`) s'il
 * appartient bien à l'utilisateur, sinon le plus récent.
 */
export async function getCurrentEvent(): Promise<EventRow | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const cols = "id, owner_id, name, type, event_date, budget_total, guest_count";
  const selected = cookies().get("current_event_id")?.value;

  // Le RLS garantit l'accès : owner OU membre accepté (can_access_event).
  if (selected) {
    const { data } = await supabase
      .from("events")
      .select(cols)
      .eq("id", selected)
      .maybeSingle();
    if (data) return data as EventRow;
  }

  const { data } = await supabase
    .from("events")
    .select(cols)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as EventRow) ?? null;
}

/** Catégories de budget (avec total dépensé) pour un événement. */
export async function getBudgetCategories(
  eventId: string
): Promise<BudgetCategory[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("budget_categories_with_spent")
    .select("id, event_id, name, budget, color, position, spent")
    .eq("event_id", eventId)
    .order("position", { ascending: true });

  return (data as BudgetCategory[]) ?? [];
}

/** Statistiques globales pour l'admin (nécessite le rôle admin via RLS). */
export async function getAdminStats(): Promise<AdminStats> {
  const supabase = createClient();

  const [users, families, vendors, events, pending] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "particulier"),
    // Prestataires RÉELS (comptes), pas les 18 fiches démo de l'annuaire.
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "prestataire"),
    // Les événements sont privés : l'admin n'y a pas accès en lecture directe.
    // On récupère seulement le compteur agrégé via une fonction SECURITY DEFINER.
    supabase.rpc("admin_events_count"),
    // En attente = fiches réelles (liées à un compte) non vérifiées.
    supabase
      .from("vendors")
      .select("*", { count: "exact", head: true })
      .eq("verified", false)
      .not("user_id", "is", null),
  ]);

  return {
    users: users.count ?? 0,
    families: families.count ?? 0,
    vendors: vendors.count ?? 0,
    events: (events.data as number | null) ?? 0,
    pendingVerification: pending.count ?? 0,
  };
}
