import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCities, getVendorsForCityCategory, slugify, MIN_VERIFIED_VENDORS } from "@/lib/geo";
import { CATEGORY_NAF_CODES, GOUV_SEARCH_API, sleep, toImportCandidate } from "@/lib/sirene";
import type { GouvSearchResponse } from "@/lib/sirene";

export const runtime = "nodejs";
// Un scan sur ~80 couples ville×catégorie, même en petits lots concurrents,
// peut dépasser la limite par défaut (10s) d'une fonction serverless
// Vercel — 60s est le plafond du plan Hobby, largement suffisant avec le
// traitement par lots ci-dessous.
export const maxDuration = 60;

// Même plafond que l'import (app/api/admin/sirene/import/route.ts) : le
// nombre affiché ici doit correspondre à ce que l'import produira réellement.
const SAMPLE_SIZE = 25;
// Traitement par petits lots concurrents plutôt qu'un appel à la fois : avec
// ~80 couples ville×catégorie, un traitement strictement séquentiel (même
// avec un délai modeste entre chaque) dépassait largement la limite de temps
// d'exécution de la fonction serverless, et le navigateur recevait "Failed
// to fetch" (connexion coupée en plein milieu) au lieu d'une vraie réponse.
const BATCH_SIZE = 5;
const DELAY_BETWEEN_BATCHES_MS = 200;

type Combo = { citySlug: string; cityName: string; category: string; activeCount: number };

// Scanne chaque couple ville×catégorie (villes de public.cities × catégories
// mappées dans CATEGORY_NAF_CODES), saute celles qui ont déjà assez de
// fiches actives (même seuil que les pages SEO géo — pas la peine de diluer
// l'existant), et renvoie les couples "creux" triés par volume d'entreprises
// réellement importables décroissant.
//
// Compte les résultats qui passeraient le filtre d'import (toImportCandidate
// — sociétés uniquement, jamais EI/micro-entreprise) plutôt que le total brut
// de l'API : sur des catégories comme "Photographe", la grande majorité des
// résultats sont des micro-entrepreneurs qui seraient de toute façon
// écartés — un total brut aurait affiché un volume trompeur, sans rapport
// avec ce que l'import produit vraiment.
export async function POST() {
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

  const cities = await getCities();
  const categories = Object.keys(CATEGORY_NAF_CODES);

  // 1. Détermine d'abord la liste des couples à interroger (rapide : lecture
  //    locale déjà mise en cache par lib/geo.ts, pas d'appel réseau externe).
  const combos: Combo[] = [];
  for (const city of cities) {
    for (const category of categories) {
      const existing = await getVendorsForCityCategory(city.slug, slugify(category));
      const activeCount = existing.filter((v) => v.verified).length;
      if (activeCount >= MIN_VERIFIED_VENDORS) continue;
      combos.push({ citySlug: city.slug, cityName: city.name, category, activeCount });
    }
  }

  const suggestions: {
    citySlug: string;
    cityName: string;
    category: string;
    available: number;
    active: number;
  }[] = [];

  let checked = 0;
  let failed = 0;
  let lastFailureStatus: number | null = null;
  // Diagnostic : d'où vient un total à zéro ? (requête qui ne renvoie rien
  // du tout, vs résultats renvoyés mais tous écartés par le filtre société).
  let totalRawResults = 0;
  let totalAfterLegalFilter = 0;
  const sampleLegalForms: string[] = [];

  // 2. Interroge l'API gouv.fr par lots concurrents.
  for (let i = 0; i < combos.length; i += BATCH_SIZE) {
    const batch = combos.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map(async (combo) => {
        const nafCodes = CATEGORY_NAF_CODES[combo.category].join(",");
        const params = new URLSearchParams({
          q: combo.cityName,
          activite_principale: nafCodes,
          etat_administratif: "A",
          per_page: String(SAMPLE_SIZE),
        });
        try {
          const res = await fetch(`${GOUV_SEARCH_API}?${params.toString()}`, {
            headers: { accept: "application/json" },
          });
          if (!res.ok) {
            console.error("sirene-scan: réponse API gouv non-ok", combo.citySlug, combo.category, res.status);
            return { combo, status: res.status as number | null, data: null };
          }
          const data = (await res.json()) as GouvSearchResponse;
          return { combo, status: null, data };
        } catch (e) {
          console.error("sirene-scan: appel API gouv échoué", combo.citySlug, combo.category, e);
          return { combo, status: null, data: null, threw: true };
        }
      })
    );

    for (const r of results) {
      checked++;
      if (r.data) {
        const rawResults = r.data.results ?? [];
        totalRawResults += rawResults.length;
        const passing = rawResults.filter((res) => toImportCandidate(res));
        totalAfterLegalFilter += passing.length;
        if (sampleLegalForms.length < 15) {
          sampleLegalForms.push(
            ...rawResults.slice(0, 15 - sampleLegalForms.length).map((res) => res.nature_juridique ?? "?")
          );
        }
        if (passing.length > 0) {
          suggestions.push({
            citySlug: r.combo.citySlug,
            cityName: r.combo.cityName,
            category: r.combo.category,
            available: passing.length,
            active: r.combo.activeCount,
          });
        }
      } else {
        failed++;
        if (r.status) lastFailureStatus = r.status;
      }
    }

    if (i + BATCH_SIZE < combos.length) await sleep(DELAY_BETWEEN_BATCHES_MS);
  }

  suggestions.sort((a, b) => b.available - a.available);
  // Si une bonne partie des requêtes a échoué (ex. limitation de débit de
  // l'API gouv.fr, publique et sans clé), le prévenir explicitement plutôt
  // que de laisser afficher "aucun couple en manque" comme si le scan avait
  // simplement conclu qu'il n'y avait rien à importer.
  const warning =
    checked > 0 && failed / checked > 0.3
      ? `${failed} des ${checked} recherches ont échoué${lastFailureStatus ? ` (dernière erreur : ${lastFailureStatus})` : ""} — l'API gouv.fr est peut-être temporairement limitée, réessaie dans quelques minutes.`
      : null;
  return NextResponse.json({
    ok: true,
    suggestions,
    checked,
    failed,
    warning,
    diagnostic: { totalRawResults, totalAfterLegalFilter, sampleLegalForms },
  });
}
