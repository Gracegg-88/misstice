import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshPlaceId } from "@/lib/google-places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHECKS_PER_RUN = 500;
const REFRESH_AFTER_DAYS = 30;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Tâche mensuelle (voir vercel.json) : vérifie que les place_id liés existent
 * toujours (appel « IDs only » gratuit). Identifiant changé → mis à jour ;
 * fiche Google disparue → lien retiré. Aucune note ni aucun avis n'est
 * récupéré ni stocké (conditions Google Maps Platform).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return NextResponse.json({ ok: true, skipped: "GOOGLE_PLACES_API_KEY absente" });
  }

  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - REFRESH_AFTER_DAYS * 86_400_000).toISOString();
  const { data, error } = await admin
    .from("vendors")
    .select("id, google_place_id")
    .not("google_place_id", "is", null)
    .or(`google_place_checked_at.is.null,google_place_checked_at.lt.${cutoff}`)
    .limit(MAX_CHECKS_PER_RUN);
  if (error) {
    console.error("google-place-ids: lecture", error);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }

  let updated = 0;
  let removed = 0;
  let failed = 0;
  for (const v of (data as { id: string; google_place_id: string }[]) ?? []) {
    try {
      const fresh = await refreshPlaceId(v.google_place_id);
      const now = new Date().toISOString();
      const patch =
        fresh === null
          ? {
              google_place_id: null,
              google_place_status: null,
              google_place_linked_at: null,
              google_place_linked_by: null,
              google_place_checked_at: now,
            }
          : { google_place_id: fresh, google_place_checked_at: now };
      const { error: upErr } = await admin.from("vendors").update(patch).eq("id", v.id);
      if (upErr) throw upErr;
      if (fresh === null) removed += 1;
      else if (fresh !== v.google_place_id) updated += 1;
    } catch (e) {
      console.error("google-place-ids: vérification", v.id, e);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, updated, removed, failed });
}
