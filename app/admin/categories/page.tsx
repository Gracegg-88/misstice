import { createClient } from "@/lib/supabase/server";
import CategoriesClient from "@/components/admin/CategoriesClient";

type Category = { id: string; name: string; position: number };

export default async function AdminCategories() {
  const supabase = createClient();
  const { data } = await supabase
    .from("vendor_categories")
    .select("id, name, position")
    .order("position", { ascending: true });

  return <CategoriesClient categories={(data as Category[]) ?? []} />;
}
