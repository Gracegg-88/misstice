import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

/**
 * Callback OAuth (ex. Google) : échange le code contre une session,
 * détecte le rôle et redirige vers le bon espace.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Anti open-redirect : uniquement un chemin interne (backslash inclus).
  const explicitNext = safeNext(searchParams.get("next"), "") || null;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Signup Google avec « Je suis prestataire » sélectionné : l'OAuth ne
      // transmet aucune métadonnée custom (contrairement à signUp), donc le
      // rôle bascule ici, après coup, via une RPC volontairement limitée à
      // soi-même (voir supabase/security.sql, become_prestataire).
      if (searchParams.get("intent") === "pro") {
        await supabase.rpc("become_prestataire");
      }

      let dest = explicitNext;
      if (!dest) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user?.id ?? "")
          .single();
        dest =
          profile?.role === "admin"
            ? "/admin"
            : profile?.role === "prestataire"
              ? "/pro"
              : "/dashboard";
      }
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=oauth`);
}
