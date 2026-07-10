import { createClient } from "@/lib/supabase/server";
import CategoriesClient, {
  type AdminCategory,
} from "@/components/admin/CategoriesClient";

export default async function AdminCategories() {
  const supabase = createClient();

  const [{ data: cats }, { data: vendors }] = await Promise.all([
    supabase
      .from("vendor_categories")
      .select("id, name, position, description, active, created_at")
      .order("position", { ascending: true }),
    // Comptage des prestataires par catégorie (table publique).
    supabase.from("vendors").select("category"),
  ]);

  // Nombre de prestataires par nom de catégorie.
  const counts = new Map<string, number>();
  for (const v of (vendors as { category: string | null }[]) ?? []) {
    if (!v.category) continue;
    counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
  }
  const totalVendors = (vendors as unknown[])?.length ?? 0;

  const categories: AdminCategory[] = (
    (cats as Omit<AdminCategory, "count">[]) ?? []
  ).map((c) => ({
    ...c,
    // `active` peut être absent si la migration n'a pas encore tourné → défaut true.
    active: c.active ?? true,
    count: counts.get(c.name) ?? 0,
  }));

  return (
    <CategoriesClient categories={categories} totalVendors={totalVendors} />
  );
}
