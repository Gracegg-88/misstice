import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase SERVICE_ROLE — SERVEUR UNIQUEMENT (jobs planifiés).
 * Contourne le RLS : à n'utiliser QUE dans des routes protégées (cron secret),
 * jamais côté navigateur. La clé n'est PAS préfixée NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant (cron non configuré).");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
