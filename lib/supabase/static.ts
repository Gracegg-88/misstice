import { createClient } from "@supabase/supabase-js";
import { supabaseEnv } from "./env";

/**
 * Client Supabase anonyme SANS cookies — pour les lectures 100% publiques
 * appelées depuis generateStaticParams (build time, aucun contexte de
 * requête : lib/supabase/server.ts y échoue car il appelle cookies()).
 * N'accède qu'à des données déjà lisibles par tous (RLS `using (true)`).
 */
export function createStaticClient() {
  const { url, anon } = supabaseEnv();
  return createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
