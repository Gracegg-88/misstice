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
        // « Réclamer ma fiche » via Google : la demande de rattachement est
        // créée ici (avec l'inscription email, c'est handle_new_user qui la
        // crée). La politique RLS n'accepte qu'une fiche importée et libre.
        const reclamer = searchParams.get("reclamer");
        if (reclamer && /^[0-9a-f-]{36}$/i.test(reclamer)) {
          const {
            data: { user: claimant },
          } = await supabase.auth.getUser();
          if (claimant) {
            await supabase
              .from("vendor_claim_requests")
              .insert({ imported_vendor_id: reclamer, user_id: claimant.id });
          }
        }
      }
      // Type d'événement choisi dans la modale avant l'OAuth Google (ne
      // survit pas à l'aller-retour vers Google contrairement à
      // sessionStorage, d'où le passage par l'URL de retour — même
      // mécanisme que `intent=pro` ci-dessus).
      const eventType = searchParams.get("eventType");

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
              : eventType
                ? `/dashboard/nouveau?type=${encodeURIComponent(eventType)}`
                : "/dashboard";
      }
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=oauth`);
}
