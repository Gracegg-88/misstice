import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// API publique du gouvernement français (data.gouv.fr) : gratuite, sans clé,
// sans compte à créer. Confirme qu'un SIRET existe et correspond à un
// établissement actif.
const GOUV_API = "https://recherche-entreprises.api.gouv.fr/search";

type Etablissement = { siret?: string; etat_administratif?: string };
type GouvResult = {
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: Etablissement;
  matching_etablissements?: Etablissement[];
};

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!rateLimit(`siret-check:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const { siret } = (await request.json().catch(() => ({}))) as {
    siret?: string;
  };
  const digits = (siret ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(digits)) {
    return NextResponse.json(
      { error: "Le numéro SIRET doit contenir exactement 14 chiffres." },
      { status: 400 }
    );
  }

  let result: GouvResult | undefined;
  try {
    // Pour un SIRET (14 chiffres), l'API attend le numéro brut en recherche
    // texte — contrairement au SIREN, il n'y a pas de préfixe "siret:".
    const res = await fetch(
      `${GOUV_API}?q=${digits}`,
      { headers: { accept: "application/json" } }
    );
    if (!res.ok) {
      throw new Error(`gouv api status ${res.status}`);
    }
    const data = (await res.json()) as { results?: GouvResult[] };
    result = data.results?.[0];
  } catch (e) {
    console.error("siret-check: appel API gouvernementale échoué", e);
    return NextResponse.json(
      {
        error:
          "Le service de vérification est momentanément indisponible. Réessayez dans quelques instants.",
      },
      { status: 502 }
    );
  }

  const candidates = [
    result?.siege,
    ...(result?.matching_etablissements ?? []),
  ].filter((e): e is Etablissement => Boolean(e));
  const match = candidates.find((e) => e.siret === digits);

  if (!match) {
    return NextResponse.json(
      {
        error:
          "Ce numéro SIRET est introuvable. Vérifiez qu'il est correctement saisi.",
      },
      { status: 400 }
    );
  }
  if (match.etat_administratif !== "A") {
    return NextResponse.json(
      { error: "Cette entreprise n'est plus déclarée active." },
      { status: 400 }
    );
  }

  const companyName =
    result?.nom_complet?.trim() || result?.nom_raison_sociale?.trim() || "";

  const admin = createAdminClient();
  const { error: rpcErr } = await admin.rpc("set_siret_verification", {
    p_profile_id: user.id,
    p_siret: digits,
    p_verified: true,
    p_company_name: companyName || null,
  });
  if (rpcErr) {
    console.error("siret-check: écriture échouée", rpcErr);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, companyName });
}
