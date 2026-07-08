import { createClient } from "@/lib/supabase/server";
import AdminUsersClient, {
  type AdminUser,
} from "@/components/admin/AdminUsersClient";

export default async function AdminUsers() {
  const supabase = createClient();
  const [{ data }, { data: auth }] = await Promise.all([
    supabase.rpc("admin_list_users"),
    supabase.auth.getUser(),
  ]);
  const users = (data as AdminUser[]) ?? [];

  return (
    <AdminUsersClient users={users} currentUserId={auth.user?.id ?? ""} />
  );
}
