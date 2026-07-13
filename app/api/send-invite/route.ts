import { NextResponse } from "next/server";
import { sendEmail, emailShell, escapeHtml, escapeAttr } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site-url";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** Envoie l'email d'invitation « équipe » au collaborateur ajouté. */
export async function POST(request: Request) {
  // Auth requise : empêche le relais d'email ouvert (phishing).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!rateLimit(`invite:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { memberId } = body as { memberId?: string };
  if (!memberId) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  // On ne fait confiance qu'à la base : le RLS (can_access_event) garantit que
  // l'appelant a bien accès à ce membre → pas de relais vers un tiers.
  const { data: member } = await supabase
    .from("event_members")
    .select("email, role, events(name)")
    .eq("id", memberId)
    .maybeSingle();
  const m = member as
    | { email: string | null; role: string | null; events: { name: string } | null }
    | null;
  if (!m) {
    return NextResponse.json({ error: "Invitation introuvable." }, { status: 403 });
  }
  if (!m.email) {
    return NextResponse.json(
      { error: "Ce collaborateur n'a pas d'email." },
      { status: 400 }
    );
  }

  // Origine PUBLIQUE : derrière un proxy/tunnel (Cloudflare, Vercel…), request.url
  // pointe vers l'hôte interne (localhost). On privilégie les en-têtes transmis,
  // avec repli sur l'URL de la requête (protocole inclus) pour le dev local.
  const origin = siteUrl(request);
  const inviteUrl = `${origin}/invitation/${memberId}`;
  const eventName = m.events?.name ?? "";
  const evt = eventName || "un événement";
  const role = m.role?.trim() ?? "";
  const subject = `Vous êtes invité·e à organiser ${evt} sur Misstice`;

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1A1A2E">Bonjour,</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6B7280">
      Vous êtes invité·e à participer à l'organisation de
      <strong>${escapeHtml(evt)}</strong>${
        role ? ` en tant que <strong>${escapeHtml(role)}</strong>` : ""
      }. Rejoignez l'équipe pour gérer ensemble le budget, les invités et les tâches.
    </p>
    <a href="${escapeAttr(inviteUrl)}"
       style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
              padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
      Rejoindre l'équipe
    </a>
    <p style="margin:22px 0 0;font-size:12px;color:#9ca3af">
      Ou copiez ce lien : <br>${escapeHtml(inviteUrl)}
    </p>`);

  const text =
    `Bonjour,\n\n` +
    `Vous êtes invité·e à participer à l'organisation de ${evt}${
      role ? ` en tant que ${role}` : ""
    }.\n\n` +
    `Rejoindre l'équipe : ${inviteUrl}\n\n— Misstice`;

  try {
    await sendEmail({ to: m.email, subject, html, text });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("send-invite:", e);
    return NextResponse.json(
      { error: "Envoi de l'email échoué." },
      { status: 502 }
    );
  }
}
