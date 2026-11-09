import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { isValidPlaceId, searchPlaceIds } from "@/lib/google-places";

export const runtime = "nodejs";

/**
 * « Connecter ma fiche Google » (espace pro).
 *  - search : place_id candidats pour la requête (par défaut : nom + ville) ;
 *  - link   : propose un place_id → statut « a_valider ». Rien n'est affiché
 *             publiquement avant la validation par un admin (un prestataire
 *             ne peut pas s'attribuer la note Google d'une autre entreprise) ;
 *  - unlink : retire le lien.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "search" | "link" | "unlink";
    query?: string;
    placeId?: string;
  };

  const admin = createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("id, name, city")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!vendor) {
    return NextResponse.json(
      { error: "Créez d'abord votre fiche prestataire." },
      { status: 404 }
    );
  }

  if (body.action === "search") {
    if (!rateLimit(`google-place-search:${user.id}`, 20, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Trop de recherches, réessayez dans une heure." },
        { status: 429 }
      );
    }
    const query = body.query?.trim() || `${vendor.name} ${vendor.city ?? ""}`;
    try {
      return NextResponse.json({ placeIds: await searchPlaceIds(query), query });
    } catch (e) {
      console.error("vendor google-place: recherche", e);
      return NextResponse.json(
        { error: "La recherche Google est indisponible pour le moment." },
        { status: 502 }
      );
    }
  }

  let update: Record<string, string | null> | null = null;
  if (body.action === "link") {
    if (!isValidPlaceId(body.placeId)) {
      return NextResponse.json({ error: "Identifiant Google invalide." }, { status: 400 });
    }
    update = {
      google_place_id: body.placeId,
      google_place_status: "a_valider",
      google_place_linked_at: new Date().toISOString(),
      google_place_linked_by: "prestataire",
    };
  } else if (body.action === "unlink") {
    update = {
      google_place_id: null,
      google_place_status: null,
      google_place_linked_at: null,
      google_place_linked_by: null,
    };
  }
  if (!update) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const { error } = await admin.from("vendors").update(update).eq("id", vendor.id);
  if (error) {
    console.error("vendor google-place: écriture", error);
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
