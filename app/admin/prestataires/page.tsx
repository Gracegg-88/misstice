import { createClient } from "@/lib/supabase/server";
import PrestatairesClient from "@/components/admin/PrestatairesClient";

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  verified: boolean;
  reviewed_at: string | null;
  isDemo: boolean;
};

export default async function AdminPrestataires() {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendors")
    .select("id, name, category, city, verified, reviewed_at, user_id")
    .order("position", { ascending: true });

  const vendors = (
    (data as (Vendor & { user_id: string | null })[]) ?? []
  ).map(({ user_id, ...v }) => ({ ...v, isDemo: user_id === null }));

  // Fiches vitrines d'abord (à nettoyer en priorité), puis pas encore relues.
  vendors.sort((a, b) => {
    if (a.isDemo !== b.isDemo) return a.isDemo ? -1 : 1;
    if (!a.reviewed_at && b.reviewed_at) return -1;
    if (a.reviewed_at && !b.reviewed_at) return 1;
    return 0;
  });

  return <PrestatairesClient vendors={vendors} />;
}
