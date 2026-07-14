import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/**
 * Client Supabase côté serveur (Server Components, Route Handlers, Server Actions).
 * Lit/écrit la session dans les cookies de la requête.
 */
export function createClient() {
  const cookieStore = cookies();
  const { url, anon } = supabaseEnv();

  return createServerClient(url, anon, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : ignoré.
            // Le middleware se charge de rafraîchir la session.
          }
        },
      },
    }
  );
}
