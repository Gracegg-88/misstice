import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback OAuth (ex. Google) : échange le code contre une session,
 * détecte le rôle et redirige vers le bon espace.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  // Anti open-redirect : uniquement un chemin interne.
  const explicitNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : null;

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
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
