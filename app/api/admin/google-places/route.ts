import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidPlaceId, searchPlaceIds } from "@/lib/google-places";

export const runtime = "nodejs";

/**
 * Lien fiche Misstice ↔ fiche Google, côté admin (/admin/prestataires).
 *  - search : place_id candidats pour « nom + ville » (ou une requête libre) ;
 *  - link   : valide un place_id (affiché ensuite sur la fiche publique) ;
 *  - unlink : retire le lien.
 * Seul le place_id est enregistré (voir supabase/google-places.sql).
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: "search" | "link" | "unlink";
    vendorId?: string;
    query?: string;
    placeId?: string;
  };
  if (!body.vendorId || !body.action) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("id, name, city")
    .eq("id", body.vendorId)
    .maybeSingle();
  if (!vendor) {
    return NextResponse.json({ error: "Fiche introuvable." }, { status: 404 });
  }

  if (body.action === "search") {
    const query = body.query?.trim() || `${vendor.name} ${vendor.city ?? ""}`;
    try {
      return NextResponse.json({ placeIds: await searchPlaceIds(query), query });
    } catch (e) {
      console.error("admin google-places: recherche", e);
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Recherche impossible." },
        { status: 502 }
      );
    }
  }

  const update =
    body.action === "link"
      ? isValidPlaceId(body.placeId)
        ? {
            google_place_id: body.placeId,
            google_place_status: "valide",
            google_place_linked_at: new Date().toISOString(),
            google_place_linked_by: "admin",
          }
        : null
      : {
          google_place_id: null,
          google_place_status: null,
          google_place_linked_at: null,
          google_place_linked_by: null,
        };
  if (!update) {
    return NextResponse.json({ error: "Identifiant Google invalide." }, { status: 400 });
  }

  const { error } = await admin.from("vendors").update(update).eq("id", vendor.id);
  if (error) {
    console.error("admin google-places: écriture", error);
    return NextResponse.json({ error: "Enregistrement impossible." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
