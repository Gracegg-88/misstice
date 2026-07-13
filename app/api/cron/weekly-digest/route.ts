import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";

export const runtime = "nodejs";
// Toujours dynamique (jamais mis en cache) : c'est un job.
export const dynamic = "force-dynamic";

const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

// Comparaison à temps constant (évite les attaques par timing sur le secret).
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function GET(request: Request) {
  // Sécurité : seul Vercel Cron (ou un appel avec le secret) est autorisé.
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }

  const now = Date.now();
  const weekAgoISO = new Date(now - 7 * 86_400_000).toISOString();

  // URL publique de confiance (pour les liens de l'email).
  const base = siteUrl(request);

  // Tout le bloc de lecture est protégé : en cas de panne DB, on échoue
  // proprement (500) au lieu de continuer avec des données partielles.
  let pros: { id: string; full_name: string | null }[];
  let emailById: Map<string, string>;
  let proByVendor: Map<string, string>;
  let convs: { data: unknown };
  let quotes: { data: unknown };
  let views: { data: unknown };
  try {
    // 1. Prestataires + emails (listUsers PAGINÉ : plus de troncature à 1000).
    const listAllUsers = async (): Promise<Map<string, string>> => {
      const m = new Map<string, string>();
      for (let page = 1; ; page++) {
        const { data, error } = await admin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });
        if (error) throw error;
        for (const u of data.users) m.set(u.id, u.email ?? "");
        if (data.users.length < 1000) break;
      }
      return m;
    };

    const [prosRes, usersMap, vendorsRes] = await Promise.all([
      admin.from("profiles").select("id, full_name").eq("role", "prestataire"),
      listAllUsers(),
      admin.from("vendors").select("id, user_id").not("user_id", "is", null),
    ]);
    if (prosRes.error) throw prosRes.error;
    if (vendorsRes.error) throw vendorsRes.error;
    pros = (prosRes.data as { id: string; full_name: string | null }[]) ?? [];
    emailById = usersMap;
    proByVendor = new Map(
      ((vendorsRes.data as { id: string; user_id: string }[]) ?? []).map((v) => [
        v.id,
        v.user_id,
      ])
    );

    // 2. Activité de la semaine (une requête par table, agrégée en mémoire).
    [convs, quotes, views] = await Promise.all([
      admin
        .from("conversations")
        .select("prestataire_id, demande, created_at")
        .gte("created_at", weekAgoISO),
      admin
        .from("quotes")
        .select("prestataire_id, status, amount, created_at")
        .gte("created_at", weekAgoISO),
      admin
        .from("profile_views")
        .select("vendor_id, viewed_at")
        .gte("viewed_at", weekAgoISO),
    ]);
  } catch (e) {
    console.error("weekly-digest fetch:", e);
    return NextResponse.json(
      { error: "Lecture des données échouée." },
      { status: 500 }
    );
  }

  type Stat = {
    demandes: number;
    devisSent: number;
    devisAccepted: number;
    views: number;
    revenue: number;
  };
  const stats = new Map<string, Stat>();
  const bump = (id: string): Stat => {
    let s = stats.get(id);
    if (!s) {
      s = { demandes: 0, devisSent: 0, devisAccepted: 0, views: 0, revenue: 0 };
      stats.set(id, s);
    }
    return s;
  };

  for (const c of (convs.data as { prestataire_id: string; demande: unknown }[]) ?? []) {
    if (c.demande != null) bump(c.prestataire_id).demandes += 1;
  }
  for (const q of (quotes.data as { prestataire_id: string; status: string; amount: number }[]) ?? []) {
    const s = bump(q.prestataire_id);
    s.devisSent += 1;
    if (q.status === "accepté") {
      s.devisAccepted += 1;
      s.revenue += Number(q.amount) || 0;
    }
  }
  for (const v of (views.data as { vendor_id: string }[]) ?? []) {
    const pid = proByVendor.get(v.vendor_id);
    if (pid) bump(pid).views += 1;
  }

  // 3. Envoi (uniquement aux pros ayant eu de l'activité).
  let sent = 0;
  let failed = 0;
  for (const p of (pros as { id: string; full_name: string | null }[]) ?? []) {
    const s = stats.get(p.id);
    if (!s) continue;
    const activity = s.demandes + s.devisSent + s.devisAccepted + s.views;
    if (activity === 0) continue;
    const email = emailById.get(p.id);
    if (!email) continue;

    const name = p.full_name?.trim() || "";
    const row = (label: string, value: string) =>
      `<tr><td style="padding:6px 0;color:#6B7280;font-size:14px">${label}</td>
        <td style="padding:6px 0;text-align:right;font-weight:700;color:#1A1A2E;font-size:15px">${value}</td></tr>`;

    const html = emailShell(`
      <h1 style="margin:0 0 6px;font-size:22px;color:#1A1A2E">Votre semaine sur Misstice${
        name ? `, ${escapeHtml(name)}` : ""
      }</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6B7280">
        Voici le récapitulatif des 7 derniers jours.
      </p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
        ${row("Nouvelles demandes", String(s.demandes))}
        ${row("Devis envoyés", String(s.devisSent))}
        ${row("Devis acceptés", String(s.devisAccepted))}
        ${row("Vues de votre fiche", String(s.views))}
        ${row("Revenu estimé (devis acceptés)", eur(s.revenue))}
      </table>
      <a href="${base}/pro"
         style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
                padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
        Voir mon espace
      </a>`);

    const text =
      `Votre semaine sur Misstice${name ? `, ${name}` : ""} :\n` +
      `- Nouvelles demandes : ${s.demandes}\n` +
      `- Devis envoyés : ${s.devisSent}\n` +
      `- Devis acceptés : ${s.devisAccepted}\n` +
      `- Vues de votre fiche : ${s.views}\n` +
      `- Revenu estimé : ${eur(s.revenue)}\n\n` +
      `Votre espace : ${base}/pro\n\n— Misstice`;

    try {
      await sendEmail({
        to: email,
        toName: name || undefined,
        subject: "Votre récap Misstice de la semaine",
        html,
        text,
      });
      sent += 1;
    } catch (e) {
      console.error("weekly-digest send:", e);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
