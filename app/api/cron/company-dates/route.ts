import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { GOUV_SEARCH_API, sleep } from "@/lib/sirene";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Par passage : reste sous la limite de l'API publique (≈ 7 req/s) et de durée. */
const BATCH = 40;

/**
 * Date de création des entreprises (fiches avec SIRET), depuis l'API
 * officielle recherche-entreprises.api.gouv.fr — jamais saisie ni devinée :
 * si l'API ne renvoie pas de date pour ce SIREN, on enregistre « vide » et
 * rien ne s'affiche. Stockée dans vendor_company_info (écriture en clé
 * service uniquement). Traite chaque jour les fiches pas encore vérifiées.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const [{ data: vendors }, { data: done }] = await Promise.all([
    supabase.from("vendors").select("id, siret").not("siret", "is", null),
    supabase.from("vendor_company_info").select("vendor_id"),
  ]);
  const seen = new Set(((done as { vendor_id: string }[]) ?? []).map((d) => d.vendor_id));
  const todo = ((vendors as { id: string; siret: string }[]) ?? [])
    .map((v) => ({ id: v.id, siret: v.siret.replace(/\D/g, "") }))
    .filter((v) => v.siret.length === 14 && !seen.has(v.id))
    .slice(0, BATCH);

  let found = 0;
  let empty = 0;
  let failed = 0;
  for (const v of todo) {
    try {
      const res = await fetch(`${GOUV_SEARCH_API}?q=${v.siret}&page=1&per_page=1`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        failed += 1; // réessayé au prochain passage
        await sleep(1000);
        continue;
      }
      const json = (await res.json()) as { results?: { siren?: string; date_creation?: string | null }[] };
      // On n'accepte que le résultat dont le SIREN correspond exactement.
      const match = json.results?.find((r) => r.siren === v.siret.slice(0, 9));
      const date = match?.date_creation && /^\d{4}-\d{2}-\d{2}$/.test(match.date_creation) ? match.date_creation : null;
      const { error } = await supabase
        .from("vendor_company_info")
        .upsert({ vendor_id: v.id, date_creation: date, fetched_at: new Date().toISOString() });
      if (error) failed += 1;
      else if (date) found += 1;
      else empty += 1;
    } catch {
      failed += 1;
    }
    await sleep(200);
  }

  return NextResponse.json({ traitees: todo.length, dates: found, sans_date: empty, echecs: failed });
}
