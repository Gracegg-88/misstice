import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCityBySlug } from "@/lib/geo";
import {
  CATEGORY_NAF_CODES,
  GOUV_SEARCH_API,
  toImportCandidate,
  type GouvSearchResponse,
} from "@/lib/sirene";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_PER_RUN = 25;

// Importe un lot de fiches vitrines pour UN couple ville×catégorie (jamais
// automatique — déclenché depuis l'écran admin, un couple à la fois, avec
// un plafond par appel pour rester maîtrisable). Aucune photo, aucune
// description inventée : seulement nom/ville/catégorie/SIRET, statut
// "non_reclamee" (voir import_sirene_vendor, supabase/vendor-import.sql).
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

  const { citySlug, category } = (await request.json().catch(() => ({}))) as {
    citySlug?: string;
    category?: string;
  };
  if (!citySlug || !category || !CATEGORY_NAF_CODES[category]) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const city = await getCityBySlug(citySlug);
  if (!city) {
    return NextResponse.json({ error: "Ville inconnue." }, { status: 400 });
  }

  const params = new URLSearchParams({
    q: city.name,
    activite_principale: CATEGORY_NAF_CODES[category].join(","),
    etat_administratif: "A",
    per_page: String(MAX_PER_RUN),
  });

  let results: GouvSearchResponse["results"] = [];
  try {
    const res = await fetch(`${GOUV_SEARCH_API}?${params.toString()}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(`gouv api status ${res.status}`);
    const data = (await res.json()) as GouvSearchResponse;
    results = data.results ?? [];
  } catch (e) {
    console.error("sirene-import: appel API gouv échoué", citySlug, category, e);
    return NextResponse.json(
      { error: "Le service de vérification est momentanément indisponible." },
      { status: 502 }
    );
  }

  const admin = createAdminClient();
  let imported = 0;
  let skippedLegalForm = 0;
  let skippedDuplicate = 0;

  for (const result of results) {
    const candidate = toImportCandidate(result);
    if (!candidate) {
      skippedLegalForm++;
      continue;
    }
    const { data: newId, error } = await admin.rpc("import_sirene_vendor", {
      p_name: candidate.name,
      p_siret: candidate.siret,
      p_city: candidate.city,
      p_category: category,
    });
    if (error) {
      console.error("sirene-import: import_sirene_vendor échoué", candidate.siret, error);
      continue;
    }
    if (newId) imported++;
    else skippedDuplicate++;
  }

  return NextResponse.json({ ok: true, imported, skippedLegalForm, skippedDuplicate });
}
