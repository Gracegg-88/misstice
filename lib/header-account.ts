import { createClient } from "@/lib/supabase/server";

export type HeaderAccount = { href: string; createHref: string };

/**
 * Résout côté serveur la destination des boutons du header selon le rôle de
 * l'utilisateur connecté (null si déconnecté). Passé à <Header initialAccount>
 * pour éviter le clignotement des boutons au premier rendu.
 */
export async function getHeaderAccount(): Promise<HeaderAccount | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (data as { role?: string } | null)?.role;
  const href =
    role === "admin" ? "/admin" : role === "prestataire" ? "/pro" : "/dashboard";
  const createHref = role === "particulier" ? "/dashboard/nouveau" : href;
  return { href, createHref };
}
