import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GOUV_API = "https://recherche-entreprises.api.gouv.fr/search";
const SIX_MONTHS_MS = 183 * 86_400_000;

type Etablissement = { siret?: string; etat_administratif?: string };
type GouvResult = {
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: Etablissement;
  matching_etablissements?: Etablissement[];
};

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

async function checkStillActive(
  siret: string
): Promise<{ active: boolean; companyName: string }> {
  // Pour un SIRET (14 chiffres), l'API attend le numéro brut en recherche
  // texte — contrairement au SIREN, il n'y a pas de préfixe "siret:".
  const res = await fetch(`${GOUV_API}?q=${siret}`, {
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`gouv api status ${res.status}`);
  const data = (await res.json()) as { results?: GouvResult[] };
  const result = data.results?.[0];
  const candidates = [
    result?.siege,
    ...(result?.matching_etablissements ?? []),
  ].filter((e): e is Etablissement => Boolean(e));
  const match = candidates.find((e) => e.siret === siret);
  return {
    active: match?.etat_administratif === "A",
    companyName:
      result?.nom_complet?.trim() || result?.nom_raison_sociale?.trim() || "",
  };
}

/**
 * Tâche hebdomadaire (voir vercel.json) : ne retraite que les prestataires
 * dont la vérification SIRET a plus de 6 mois — équivaut à une revérification
 * tous les 6 mois pour chacun, sans dépendre d'une date calendaire fixe.
 * Un SIRET qui n'est plus actif retire le badge "Vérifié" (réversible, sans
 * conséquence sur le compte) et alerte les admins par email pour décision.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const admin = createAdminClient();
  const cutoffISO = new Date(Date.now() - SIX_MONTHS_MS).toISOString();

  const { data: due, error: dueErr } = await admin
    .from("vendor_profiles")
    .select("id, company, siret, siret_verified_at")
    .not("siret", "is", null)
    .not("siret_verified_at", "is", null)
    .lt("siret_verified_at", cutoffISO);
  if (dueErr) {
    console.error("siret-recheck fetch:", dueErr);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }

  const rows =
    (due as { id: string; company: string; siret: string; siret_verified_at: string }[]) ??
    [];

  let refreshed = 0;
  let revoked = 0;
  let failed = 0;
  const revokedList: { company: string; siret: string }[] = [];

  for (const row of rows) {
    try {
      const { active, companyName } = await checkStillActive(row.siret);
      if (active) {
        await admin.rpc("set_siret_verification", {
          p_profile_id: row.id,
          p_siret: row.siret,
          p_verified: true,
          p_company_name: companyName || null,
        });
        refreshed += 1;
      } else {
        await admin.rpc("set_siret_verification", {
          p_profile_id: row.id,
          p_siret: row.siret,
          p_verified: false,
          p_company_name: null,
        });
        revoked += 1;
        revokedList.push({ company: row.company, siret: row.siret });
      }
    } catch (e) {
      console.error("siret-recheck:", row.id, e);
      failed += 1;
    }
  }

  if (revokedList.length > 0) {
    try {
      const { data: admins } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "admin");
      const adminIds = new Set(
        ((admins as { id: string }[]) ?? []).map((a) => a.id)
      );
      const emails: string[] = [];
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) break;
        for (const u of data.users) {
          if (adminIds.has(u.id) && u.email) emails.push(u.email);
        }
        if (data.users.length < 1000) break;
      }

      const list = revokedList
        .map(
          (r) =>
            `<li>${escapeHtml(r.company)} — SIRET ${escapeHtml(r.siret)}</li>`
        )
        .join("");
      const html = emailShell(`
        <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Badge "Vérifié" retiré automatiquement</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
          La revérification semestrielle du SIRET a échoué pour ${revokedList.length}
          prestataire(s) — leur SIRET n'est plus déclaré actif. Le badge "Vérifié"
          a été retiré automatiquement, sans autre action sur leur compte.
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;color:#1A1A2E">${list}</ul>
        <p style="margin:0;font-size:13px;color:#9ca3af">
          À vous de décider si une action supplémentaire est nécessaire.
        </p>`);
      for (const to of emails) {
        await sendEmail({
          to,
          subject: `Misstice — ${revokedList.length} SIRET non renouvelé(s)`,
          html,
          text: `${revokedList.length} prestataire(s) ont perdu leur badge "Vérifié" (SIRET plus actif) :\n${revokedList
            .map((r) => `- ${r.company} (${r.siret})`)
            .join("\n")}`,
        });
      }
    } catch (e) {
      console.error("siret-recheck: alerte admin échouée", e);
    }
  }

  return NextResponse.json({ ok: true, refreshed, revoked, failed });
}
