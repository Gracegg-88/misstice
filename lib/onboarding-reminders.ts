import { createHmac, timingSafeEqual } from "crypto";
import { emailShell, escapeHtml } from "@/lib/email";

// Relances des prestataires dont l'inscription n'est pas finalisée :
// SIRET non vérifié et/ou compte Stripe non actif (paiements impossibles).
// Calendrier : J+3, J+7, puis tous les 5 jours, jusqu'à finalisation ou
// désabonnement.

const DAY_MS = 86_400_000;

export const FIRST_REMINDER_DAYS = 3;
export const SECOND_REMINDER_DAYS = 7;
export const REPEAT_EVERY_DAYS = 5;

/**
 * La relance n°(sentCount + 1) est-elle due maintenant ?
 * Les écarts minimaux entre deux envois évitent une rafale le jour du
 * déploiement pour les comptes déjà anciens (ex. inscrit il y a 30 jours :
 * 1re relance aujourd'hui, 2e dans 4 jours, puis tous les 5 jours).
 */
export function isReminderDue(opts: {
  signupAt: Date;
  sentCount: number;
  lastSentAt: Date | null;
  now: Date;
}): boolean {
  const { signupAt, sentCount, lastSentAt, now } = opts;
  const ageDays = (now.getTime() - signupAt.getTime()) / DAY_MS;
  const sinceLastDays = lastSentAt
    ? (now.getTime() - lastSentAt.getTime()) / DAY_MS
    : Infinity;

  if (sentCount === 0) return ageDays >= FIRST_REMINDER_DAYS;
  if (sentCount === 1) {
    return (
      ageDays >= SECOND_REMINDER_DAYS &&
      sinceLastDays >= SECOND_REMINDER_DAYS - FIRST_REMINDER_DAYS
    );
  }
  return sinceLastDays >= REPEAT_EVERY_DAYS;
}

// ── Lien de désabonnement signé (pas de compte requis pour se désabonner) ──

function unsubscribeSecret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET;
  if (!s) throw new Error("UNSUBSCRIBE_SECRET (ou CRON_SECRET) manquant.");
  return s;
}

export function unsubscribeToken(vendorProfileId: string): string {
  return createHmac("sha256", unsubscribeSecret())
    .update(`onboarding-reminders:${vendorProfileId}`)
    .digest("base64url");
}

export function isValidUnsubscribeToken(
  vendorProfileId: string,
  token: string
): boolean {
  const expected = Buffer.from(unsubscribeToken(vendorProfileId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function unsubscribeUrls(base: string, vendorProfileId: string) {
  const qs = `id=${encodeURIComponent(vendorProfileId)}&t=${encodeURIComponent(
    unsubscribeToken(vendorProfileId)
  )}`;
  return {
    // Page lisible (bouton de confirmation) — lien en pied d'email.
    page: `${base}/desabonnement?${qs}`,
    // Désabonnement en un clic (RFC 8058) — en-tête List-Unsubscribe.
    oneClick: `${base}/api/unsubscribe/onboarding?${qs}`,
  };
}

// ── Contenu de l'email ──────────────────────────────────────────────────────

export function buildReminderEmail(opts: {
  base: string;
  vendorProfileId: string;
  firstName: string | null;
  missingSiret: boolean;
  missingStripe: boolean;
  stripeStarted: boolean;
  reminderNumber: number;
}) {
  const {
    base,
    vendorProfileId,
    firstName,
    missingSiret,
    missingStripe,
    stripeStarted,
    reminderNumber,
  } = opts;

  const profileUrl = `${base}/pro/profil`;
  const unsub = unsubscribeUrls(base, vendorProfileId);
  const hello = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  const subject =
    reminderNumber === 1
      ? "Plus qu'une étape pour finaliser votre inscription sur Misstice"
      : reminderNumber === 2
        ? "Votre compte prestataire Misstice n'est pas encore finalisé"
        : "Rappel : finalisez votre inscription prestataire sur Misstice";

  const items: { title: string; detail: string }[] = [];
  if (missingSiret) {
    items.push({
      title: "Votre numéro d'entreprise (SIRET)",
      detail:
        "Il nous permet de vérifier votre activité et rassure vos futurs clients.",
    });
  }
  if (missingStripe) {
    items.push({
      title: stripeStarted
        ? "La configuration de votre compte Stripe"
        : "La liaison de votre compte Stripe",
      detail:
        "C'est par Stripe que vous recevez vos paiements sur Misstice, de façon sécurisée. Sans compte Stripe actif, vous ne pouvez pas être payé via la plateforme.",
    });
  }

  const listHtml = items
    .map(
      (i) => `
      <li style="margin:0 0 12px">
        <strong style="color:#1E1B2E">${escapeHtml(i.title)}</strong><br />
        <span style="color:#6B7280">${escapeHtml(i.detail)}</span>
      </li>`
    )
    .join("");

  const html = emailShell(`
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1E1B2E">${escapeHtml(hello)}</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1E1B2E">
      Merci de vous être inscrit sur Misstice. Votre compte prestataire est
      presque prêt, il ne manque plus que :
    </p>
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.5">${listHtml}</ul>
    <p style="margin:0 0 24px;text-align:center">
      <a href="${escapeHtml(profileUrl)}" style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;font-size:14px">Finaliser mon inscription</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6B7280">
      Cela ne prend que quelques minutes. Une question ou un blocage ?
      Répondez simplement à cet email, nous vous aidons.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#1E1B2E">À très vite sur Misstice,<br />L'équipe Misstice</p>
    <hr style="margin:28px 0 16px;border:none;border-top:1px solid #eeeeee" />
    <p style="margin:0;font-size:11px;line-height:1.6;color:#9ca3af">
      Vous recevez cet email car vous avez créé un compte prestataire sur
      Misstice et votre inscription n'est pas finalisée. Vous ne souhaitez
      plus recevoir ces rappels ?
      <a href="${escapeHtml(unsub.page)}" style="color:#9ca3af;text-decoration:underline">Se désabonner</a>.
    </p>`);

  const text = [
    hello,
    "",
    "Merci de vous être inscrit sur Misstice. Votre compte prestataire est presque prêt, il ne manque plus que :",
    ...items.map((i) => `- ${i.title} : ${i.detail}`),
    "",
    `Finaliser mon inscription : ${profileUrl}`,
    "",
    "Une question ou un blocage ? Répondez simplement à cet email.",
    "",
    "L'équipe Misstice",
    "",
    "--",
    "Vous recevez cet email car vous avez créé un compte prestataire sur Misstice et votre inscription n'est pas finalisée.",
    `Se désabonner de ces rappels : ${unsub.page}`,
  ].join("\n");

  const headers = {
    "List-Unsubscribe": `<${unsub.oneClick}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  return { subject, html, text, headers };
}
