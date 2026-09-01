import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCities, getVendorsForCityCategory, slugify, MIN_VERIFIED_VENDORS } from "@/lib/geo";
import { CATEGORY_NAF_CODES, GOUV_SEARCH_API, sleep } from "@/lib/sirene";
import type { GouvSearchResponse } from "@/lib/sirene";

export const runtime = "nodejs";

// Scanne chaque couple ville×catégorie (villes de public.cities × catégories
// mappées dans CATEGORY_NAF_CODES), saute celles qui ont déjà assez de
// fiches actives (même seuil que les pages SEO géo — pas la peine de diluer
// l'existant), et renvoie les couples "creux" triés par volume d'entreprises
// disponibles décroissant. Ne lit qu'un total (per_page=1) : pas d'import ici.
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

  const suggestions: {
    citySlug: string;
    cityName: string;
    category: string;
    available: number;
    active: number;
  }[] = [];

  for (const city of cities) {
    for (const category of categories) {
      const existing = await getVendorsForCityCategory(city.slug, slugify(category));
      const activeCount = existing.filter((v) => v.verified).length;
      if (activeCount >= MIN_VERIFIED_VENDORS) continue;

      const nafCodes = CATEGORY_NAF_CODES[category].join(",");
      const params = new URLSearchParams({
        q: city.name,
        activite_principale: nafCodes,
        etat_administratif: "A",
        per_page: "1",
      });
      try {
        const res = await fetch(`${GOUV_SEARCH_API}?${params.toString()}`, {
          headers: { accept: "application/json" },
        });
        if (res.ok) {
          const data = (await res.json()) as GouvSearchResponse;
          const available = data.total_results ?? 0;
          if (available > 0) {
            suggestions.push({
              citySlug: city.slug,
              cityName: city.name,
              category,
              available,
              active: activeCount,
            });
          }
        }
      } catch (e) {
        console.error("sirene-scan: appel API gouv échoué", city.slug, category, e);
      }
      await sleep(150);
    }
  }

  suggestions.sort((a, b) => b.available - a.available);
  return NextResponse.json({ ok: true, suggestions });
}
