import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

/**
 * Client Supabase côté navigateur (composants "use client").
 * Utilise les variables publiques NEXT_PUBLIC_* .
 */
export function createClient() {
  const { url, anon } = supabaseEnv();
  return createBrowserClient(url, anon);
}
