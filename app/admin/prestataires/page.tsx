import { createClient } from "@/lib/supabase/server";
import PrestatairesClient from "@/components/admin/PrestatairesClient";

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  verified: boolean;
  reviewed_at: string | null;
};

export default async function AdminPrestataires() {
  const supabase = createClient();
  // Uniquement les fiches liées à un VRAI compte prestataire : on exclut les
  // 18 fiches vitrines (user_id null) que l'admin ne gère pas.
  const { data } = await supabase
    .from("vendors")
    .select("id, name, category, city, verified, reviewed_at")
    .not("user_id", "is", null)
    .order("position", { ascending: true });

  // Pas encore relues d'abord — sert aussi de liste "à faire".
  const vendors = ((data as Vendor[]) ?? []).sort((a, b) => {
    if (!a.reviewed_at && b.reviewed_at) return -1;
    if (a.reviewed_at && !b.reviewed_at) return 1;
    return 0;
  });

  return <PrestatairesClient vendors={vendors} />;
}
