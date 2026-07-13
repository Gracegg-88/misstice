import { createClient } from "@/lib/supabase/server";
import PrestatairesClient from "@/components/admin/PrestatairesClient";

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  verified: boolean;
};

export default async function AdminPrestataires() {
  const supabase = createClient();
  // Uniquement les fiches liées à un VRAI compte prestataire : on exclut les
  // 18 fiches vitrines (user_id null) que l'admin ne gère pas.
  const { data } = await supabase
    .from("vendors")
    .select("id, name, category, city, verified")
    .not("user_id", "is", null)
    .order("position", { ascending: true });

  return <PrestatairesClient vendors={(data as Vendor[]) ?? []} />;
}
