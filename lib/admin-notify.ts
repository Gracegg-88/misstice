import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Emails de tous les comptes admin — SERVEUR UNIQUEMENT (nécessite un
 * client service_role pour lister les utilisateurs). Paginé : listUsers
 * plafonne à 1000 par page.
 */
export async function getAdminEmails(admin: SupabaseClient): Promise<string[]> {
  const { data: admins } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  const adminIds = new Set(
    ((admins as { id: string }[]) ?? []).map((a) => a.id)
  );

  const emails: string[] = [];
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) break;
    for (const u of data.users) {
      if (adminIds.has(u.id) && u.email) emails.push(u.email);
    }
    if (data.users.length < 1000) break;
  }
  return emails;
}
