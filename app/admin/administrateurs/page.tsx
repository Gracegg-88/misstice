import { redirect } from "next/navigation";
import AdminsClient, { type AdminRow } from "@/components/admin/AdminsClient";
import { getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AdministrateursPage() {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/");
  // Seuls les super-admins gèrent les administrateurs.
  if (!profile.can_manage_admins) redirect("/admin");

  const supabase = createClient();
  const { data } = await supabase.rpc("admin_list_admins");
  const admins = ((data as AdminRow[]) ?? []);

  return <AdminsClient initial={admins} currentUserId={profile.id} />;
}
