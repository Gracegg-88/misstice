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
  const { data } = await supabase
    .from("vendors")
    .select("id, name, category, city, verified")
    .order("position", { ascending: true });

  return <PrestatairesClient vendors={(data as Vendor[]) ?? []} />;
}
