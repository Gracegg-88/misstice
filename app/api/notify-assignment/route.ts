import { NextResponse } from "next/server";
import { sendEmail, emailShell, escapeHtml, escapeAttr } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Notifie un collaborateur qu'une tâche lui a été assignée.
 * Body : { email, name, taskLabel, eventName, assignerName, url }.
 */
export async function POST(request: Request) {
  // Auth requise : empêche le relais d'email ouvert.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!rateLimit(`notify:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { eventId, email, name, taskLabel, assignerName, url } = payload as {
    eventId?: string;
    email?: string;
    name?: string;
    taskLabel?: string;
    assignerName?: string;
    url?: string;
  };
  if (!eventId || !email || !taskLabel) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  // Un lien éventuel doit rester interne à l'application.
  if (url && !String(url).startsWith(origin + "/")) {
    return NextResponse.json({ error: "Lien non autorisé." }, { status: 400 });
  }

  // SÉCURITÉ (HIGH-1) : on ne fait PAS confiance au body pour le destinataire.
  // 1) l'événement doit être accessible à l'appelant (RLS) → nom fiable ;
  // 2) l'adresse doit être celle d'un COLLABORATEUR de cet événement.
  // → impossible d'envoyer un email Misstice à une adresse arbitraire.
  const { data: ev } = await supabase
    .from("events")
    .select("name")
    .eq("id", eventId)
    .maybeSingle();
  if (!ev) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const { data: member } = await supabase
    .from("event_members")
    .select("email")
    .eq("event_id", eventId)
    .eq("email", String(email))
    .maybeSingle();
  if (!member) {
    return NextResponse.json(
      { error: "Destinataire non autorisé." },
      { status: 403 }
    );
  }
  const to = (member as { email: string }).email;

  const evt = (ev as { name: string }).name || "un événement";
  const by = assignerName ? String(assignerName) : "L'organisateur";
  const subject = `${evt} — Une tâche vous a été assignée`;
  const link = url || "";

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1A1A2E">Bonjour ${escapeHtml(
      name || ""
    )},</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6B7280">
      ${escapeHtml(by)} vous a assigné une tâche pour
      <strong>${escapeHtml(evt)}</strong> :
    </p>
    <div style="margin:0 0 20px;padding:14px 16px;background:#F1ECFD;border-radius:12px;
                font-size:16px;font-weight:700;color:#1A1A2E">
      ✔ ${escapeHtml(taskLabel)}
    </div>
    ${
      link
        ? `<a href="${escapeAttr(link)}"
             style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
                    padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
             Voir la checklist
           </a>`
        : ""
    }`);

  const text =
    `Bonjour ${name || ""},\n\n` +
    `${by} vous a assigné une tâche pour ${evt} : ${taskLabel}.\n\n` +
    (link ? `Voir la checklist : ${link}\n\n` : "") +
    `— Misstice`;

  try {
    await sendEmail({ to, toName: name, subject, html, text });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notify-assignment:", e);
    return NextResponse.json(
      { error: "Envoi de l'email échoué." },
      { status: 502 }
    );
  }
}
