import { NextResponse } from "next/server";
import { sendEmail, emailShell, escapeHtml, escapeAttr } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Envoie l'email d'invitation RSVP à un invité. */
export async function POST(request: Request) {
  // Auth requise : empêche le relais d'email ouvert (phishing).
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const { rsvpUrl } = body as { rsvpUrl?: string };
  if (!rsvpUrl) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 });
  }

  // Le lien doit pointer vers notre propre application (pas de lien arbitraire).
  const origin = new URL(request.url).origin;
  if (!rsvpUrl.startsWith(origin + "/rsvp/")) {
    return NextResponse.json({ error: "Lien non autorisé." }, { status: 400 });
  }

  // Vérif d'appartenance : on ne fait confiance qu'à la base, pas au corps.
  // L'id de l'invité vient du lien ; le RLS (can_access_event) garantit que
  // l'appelant a bien accès à cet invité → pas de relais vers un tiers.
  const guestId = rsvpUrl.split("/rsvp/")[1]?.split(/[/?#]/)[0] ?? "";
  const { data: guest } = await supabase
    .from("guests")
    .select("name, email, events(name, invitation_card_url)")
    .eq("id", guestId)
    .maybeSingle();
  const g = guest as
    | {
        name: string;
        email: string | null;
        events: { name: string; invitation_card_url: string | null } | null;
      }
    | null;
  if (!g) {
    return NextResponse.json({ error: "Invité introuvable." }, { status: 403 });
  }
  if (!g.email) {
    return NextResponse.json(
      { error: "Cet invité n'a pas d'email." },
      { status: 400 }
    );
  }

  const name = g.name;
  const email = g.email;
  const eventName = g.events?.name ?? "";
  const cardUrl = g.events?.invitation_card_url ?? null;
  const evt = eventName || "notre événement";
  const subject = `${eventName ? evt + " — " : ""}Confirmez votre présence`;

  // Liens directs Accepter / Décliner (la page RSVP lit le paramètre `r`).
  const sep = rsvpUrl.includes("?") ? "&" : "?";
  const yesUrl = `${rsvpUrl}${sep}r=confirm%C3%A9`;
  const noUrl = `${rsvpUrl}${sep}r=d%C3%A9clin%C3%A9`;

  const buttons = `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto"><tr>
      <td style="padding:6px">
        <a href="${escapeAttr(yesUrl)}"
           style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
                  padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
          ✓ Je confirme
        </a>
      </td>
      <td style="padding:6px">
        <a href="${escapeAttr(noUrl)}"
           style="display:inline-block;background:#fff;color:#1A1A2E;text-decoration:none;border:1px solid #e5e7eb;
                  padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
          Je décline
        </a>
      </td>
    </tr></table>`;

  // Si l'organisateur a téléversé une carte, on l'affiche directement dans
  // l'email ; sinon message générique.
  const html = cardUrl
    ? emailShell(`
        <p style="margin:0 0 14px;font-size:15px;color:#6B7280">Bonjour ${escapeHtml(name || "")},</p>
        <img src="${escapeAttr(cardUrl)}" alt="Invitation"
             style="display:block;width:100%;max-width:520px;border-radius:14px;margin:0 0 20px" />
        <p style="margin:0 0 16px;font-size:15px;color:#6B7280">Merci de nous indiquer si vous serez présent·e :</p>
        ${buttons}
        <p style="margin:22px 0 0;font-size:12px;color:#9ca3af">
          Ou ouvrez l'invitation : <br>${escapeHtml(rsvpUrl)}
        </p>`)
    : emailShell(`
        <h1 style="margin:0 0 8px;font-size:22px;color:#1A1A2E">Bonjour ${escapeHtml(name || "")},</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6B7280">
          Vous êtes convié·e à <strong>${escapeHtml(evt)}</strong>. Merci de nous
          indiquer si vous serez présent·e.
        </p>
        ${buttons}
        <p style="margin:22px 0 0;font-size:12px;color:#9ca3af">
          Ou copiez ce lien : <br>${escapeHtml(rsvpUrl)}
        </p>`);

  const text =
    `Bonjour ${name || ""},\n\n` +
    `Vous êtes convié·e à ${evt}. Merci de nous indiquer si vous serez présent·e.\n\n` +
    `Répondre à l'invitation : ${rsvpUrl}\n\n— Misstice`;

  try {
    await sendEmail({ to: email, toName: name, subject, html, text });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("send-rsvp:", e);
    return NextResponse.json(
      { error: "Envoi de l'email échoué." },
      { status: 502 }
    );
  }
}
