import type { SupabaseClient } from "@supabase/supabase-js";
import { emailShell, escapeHtml, sendEmail } from "@/lib/email";

// Emails liés aux demandes de devis adressées à un prestataire dont les
// paiements Stripe ne sont pas actifs (il ne peut pas envoyer de devis) :
//  1. au prestataire, à chaque nouvelle demande : « activez vos paiements » ;
//  2. au client, 72 h après la demande si rien n'a bougé : prévenu, avec
//     3 prestataires similaires (même catégorie, même ville).
// Le suivi (dates de demande et d'envoi) vit dans quote_request_alerts
// (supabase/payouts-gating.sql), réservé au service role.

export const CLIENT_ALERT_DELAY_HOURS = 72;

type AlertRow = {
  conversation_id: string;
  requested_at: string;
  vendor_alert_sent_at: string | null;
  client_alert_sent_at: string | null;
};

type ConversationRow = {
  id: string;
  particulier_id: string;
  prestataire_id: string;
  vendor_id: string | null;
  vendor_name: string | null;
  particulier_name: string | null;
};

export type SimilarVendor = {
  id: string;
  name: string;
  category: string;
  city: string;
  payoutsEnabled: boolean;
};

const button = (href: string, label: string) =>
  `<a href="${escapeHtml(href)}" style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;font-size:14px">${escapeHtml(label)}</a>`;

const para = (html: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1E1B2E">${html}</p>`;

const firstNameOf = (full: string | null | undefined) =>
  full?.trim().split(/\s+/)[0] || null;

const normalizeCity = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

// ── 1. Email au prestataire ─────────────────────────────────────────────────

export function buildVendorPayoutsAlertEmail(opts: {
  base: string;
  vendorFirstName: string | null;
  clientName: string;
}) {
  const { base, vendorFirstName, clientName } = opts;
  const hello = vendorFirstName ? `Bonjour ${vendorFirstName},` : "Bonjour,";
  const subject = `Vous avez une demande de ${clientName}, activez vos paiements pour y répondre`;
  const activateUrl = `${base}/api/stripe/connect/onboard`;
  const demandesUrl = `${base}/pro/demandes`;

  const html = emailShell(`
    ${para(escapeHtml(hello))}
    ${para(
      `Vous avez une demande de <strong>${escapeHtml(clientName)}</strong>, activez vos paiements pour y répondre.`
    )}
    ${para(
      "Vous pouvez déjà lire sa demande et lui écrire dans la messagerie. Pour lui envoyer un devis, il vous reste une étape : vérifier votre identité et vos informations bancaires via Stripe, notre partenaire de paiement sécurisé. Cela prend une dizaine de minutes."
    )}
    <p style="margin:0 0 16px;text-align:center">${button(activateUrl, "Activer mes paiements")}</p>
    <p style="margin:0 0 24px;text-align:center;font-size:13px">
      <a href="${escapeHtml(demandesUrl)}" style="color:#6C3CE1">Lire la demande</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#6B7280">
      Sans réponse de votre part sous 72 h, nous prévenons la famille pour
      qu'elle ne reste pas sans nouvelles.
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#1E1B2E">L'équipe Misstice</p>`);

  const text = [
    hello,
    "",
    `Vous avez une demande de ${clientName}, activez vos paiements pour y répondre.`,
    "",
    "Vous pouvez déjà lire sa demande et lui écrire dans la messagerie. Pour lui envoyer un devis, activez vos paiements via Stripe (une dizaine de minutes).",
    "",
    `Activer mes paiements : ${activateUrl}`,
    `Lire la demande : ${demandesUrl}`,
    "",
    "Sans réponse de votre part sous 72 h, nous prévenons la famille pour qu'elle ne reste pas sans nouvelles.",
    "",
    "L'équipe Misstice",
  ].join("\n");

  return { subject, html, text };
}

/**
 * Envoie l'alerte au prestataire pour la demande en cours de la conversation,
 * si ses paiements ne sont pas actifs et qu'elle n'est pas déjà partie pour
 * cette demande. Idempotent : renvoie "skipped" sinon.
 */
export async function sendVendorPayoutsAlert(
  admin: SupabaseClient,
  conversationId: string,
  base: string
): Promise<"sent" | "skipped"> {
  const { data: alertData } = await admin
    .from("quote_request_alerts")
    .select("conversation_id, requested_at, vendor_alert_sent_at, client_alert_sent_at")
    .eq("conversation_id", conversationId)
    .maybeSingle();
  const alert = alertData as AlertRow | null;
  if (!alert || alert.vendor_alert_sent_at) return "skipped";

  const { data: convData } = await admin
    .from("conversations")
    .select("id, particulier_id, prestataire_id, vendor_id, vendor_name, particulier_name")
    .eq("id", conversationId)
    .maybeSingle();
  const conv = convData as ConversationRow | null;
  if (!conv) return "skipped";

  const { data: vp } = await admin
    .from("vendor_profiles")
    .select("payouts_enabled")
    .eq("id", conv.prestataire_id)
    .maybeSingle();
  if ((vp as { payouts_enabled: boolean } | null)?.payouts_enabled) return "skipped";

  const [{ data: userRes }, { data: prof }] = await Promise.all([
    admin.auth.admin.getUserById(conv.prestataire_id),
    admin.from("profiles").select("full_name").eq("id", conv.prestataire_id).maybeSingle(),
  ]);
  const email = userRes?.user?.email;
  if (!email) return "skipped";
  const fullName = (prof as { full_name: string | null } | null)?.full_name ?? null;

  const { subject, html, text } = buildVendorPayoutsAlertEmail({
    base,
    vendorFirstName: firstNameOf(fullName),
    clientName: conv.particulier_name?.trim() || "une famille",
  });
  await sendEmail({ to: email, toName: fullName?.trim() || undefined, subject, html, text });

  const { error } = await admin
    .from("quote_request_alerts")
    .update({ vendor_alert_sent_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("requested_at", alert.requested_at);
  if (error) throw error;
  return "sent";
}

// ── 2. Email au client après 72 h ───────────────────────────────────────────

/**
 * Jusqu'à 3 prestataires de la même catégorie et de la même ville, visibles
 * dans l'annuaire et contactables (fiche réclamée et vérifiée) — ceux dont
 * les paiements sont actifs d'abord, puisqu'eux seuls peuvent envoyer un devis.
 */
export async function findSimilarVendors(
  admin: SupabaseClient,
  vendorId: string
): Promise<SimilarVendor[]> {
  const { data: source } = await admin
    .from("vendors")
    .select("id, category, city")
    .eq("id", vendorId)
    .maybeSingle();
  const src = source as { id: string; category: string | null; city: string | null } | null;
  if (!src?.category || !src.city?.trim()) return [];

  // Ville comparée après normalisation (casse, accents, espaces : les données
  // contiennent « PARIS », « Paris », « Aix-en-Provence  »…).
  const cityKey = normalizeCity(src.city);
  const { data } = await admin
    .from("vendors")
    .select("id, name, category, city, payouts_enabled, rating, reviews")
    .eq("category", src.category)
    .eq("claim_status", "reclamee")
    .eq("verified", true)
    .not("user_id", "is", null)
    .neq("id", src.id)
    .order("payouts_enabled", { ascending: false })
    .order("rating", { ascending: false })
    .order("reviews", { ascending: false })
    .limit(200);

  return (
    (data as
      | { id: string; name: string; category: string; city: string | null; payouts_enabled: boolean }[]
      | null) ?? []
  )
    .filter((v) => v.city && normalizeCity(v.city) === cityKey)
    .slice(0, 3)
    .map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    city: v.city?.trim() ?? "",
    payoutsEnabled: Boolean(v.payouts_enabled),
  }));
}

export function buildClientStalledEmail(opts: {
  base: string;
  clientFirstName: string | null;
  vendorName: string;
  conversationId: string;
  similar: SimilarVendor[];
}) {
  const { base, clientFirstName, vendorName, conversationId, similar } = opts;
  const hello = clientFirstName ? `Bonjour ${clientFirstName},` : "Bonjour,";
  const subject = `Votre demande à ${vendorName} : on vous tient au courant`;
  const conversationUrl = `${base}/dashboard/messages/${conversationId}`;
  const directoryUrl = `${base}/prestataires`;

  const listHtml = similar
    .map(
      (v) => `
      <li style="margin:0 0 10px">
        <a href="${escapeHtml(`${base}/prestataires/${v.id}`)}" style="color:#6C3CE1;font-weight:600">${escapeHtml(v.name)}</a><br />
        <span style="color:#6B7280">${escapeHtml(v.category)}${v.city ? ` · ${escapeHtml(v.city)}` : ""}</span>
      </li>`
    )
    .join("");

  const html = emailShell(`
    ${para(escapeHtml(hello))}
    ${para(
      `Il y a 3 jours, vous avez demandé un devis à <strong>${escapeHtml(vendorName)}</strong>. Ce prestataire n'a pas encore finalisé l'activation des paiements sécurisés sur Misstice : il ne peut donc pas encore vous envoyer de devis.`
    )}
    ${para(
      "Vous pouvez continuer d'échanger avec lui dans votre messagerie. Pour ne pas perdre de temps, vous pouvez aussi demander un devis à d'autres prestataires en parallèle."
    )}
    ${
      similar.length
        ? `${para("Quelques prestataires similaires, dans la même ville :")}
    <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.5">${listHtml}</ul>`
        : ""
    }
    <p style="margin:0 0 16px;text-align:center">${button(directoryUrl, "Voir d'autres prestataires")}</p>
    <p style="margin:0 0 24px;text-align:center;font-size:13px">
      <a href="${escapeHtml(conversationUrl)}" style="color:#6C3CE1">Reprendre la conversation avec ${escapeHtml(vendorName)}</a>
    </p>
    <p style="margin:0;font-size:14px;line-height:1.6;color:#1E1B2E">L'équipe Misstice</p>`);

  const text = [
    hello,
    "",
    `Il y a 3 jours, vous avez demandé un devis à ${vendorName}. Ce prestataire n'a pas encore finalisé l'activation des paiements sécurisés sur Misstice : il ne peut donc pas encore vous envoyer de devis.`,
    "",
    "Vous pouvez continuer d'échanger avec lui dans votre messagerie, ou demander un devis à d'autres prestataires en parallèle.",
    ...(similar.length
      ? [
          "",
          "Quelques prestataires similaires, dans la même ville :",
          ...similar.map((v) => `- ${v.name} (${v.category}${v.city ? `, ${v.city}` : ""}) : ${base}/prestataires/${v.id}`),
        ]
      : []),
    "",
    `Voir d'autres prestataires : ${directoryUrl}`,
    `Reprendre la conversation : ${conversationUrl}`,
    "",
    "L'équipe Misstice",
  ].join("\n");

  return { subject, html, text };
}

/**
 * Prévient le client si, 72 h après sa demande, le prestataire n'a toujours
 * pas activé ses paiements (donc pas pu envoyer de devis). Idempotent.
 */
export async function sendClientStalledAlert(
  admin: SupabaseClient,
  alert: AlertRow,
  base: string
): Promise<"sent" | "skipped"> {
  if (alert.client_alert_sent_at) return "skipped";

  const { data: convData } = await admin
    .from("conversations")
    .select("id, particulier_id, prestataire_id, vendor_id, vendor_name, particulier_name")
    .eq("id", alert.conversation_id)
    .maybeSingle();
  const conv = convData as ConversationRow | null;
  if (!conv) return "skipped";

  const { data: vp } = await admin
    .from("vendor_profiles")
    .select("payouts_enabled")
    .eq("id", conv.prestataire_id)
    .maybeSingle();
  const payoutsEnabled = Boolean((vp as { payouts_enabled: boolean } | null)?.payouts_enabled);

  // Un devis a été envoyé depuis la demande : rien à signaler (cas d'une
  // activation suivie d'un devis dans les 72 h).
  const { count: quotesSince } = await admin
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conv.id)
    .gte("created_at", alert.requested_at);

  const markDone = async () => {
    const { error } = await admin
      .from("quote_request_alerts")
      .update({ client_alert_sent_at: new Date().toISOString() })
      .eq("conversation_id", conv.id)
      .eq("requested_at", alert.requested_at);
    if (error) throw error;
  };

  if (payoutsEnabled || (quotesSince ?? 0) > 0) {
    // Plus rien à faire pour cette demande : on la clôt sans email.
    await markDone();
    return "skipped";
  }

  const [{ data: userRes }, { data: prof }, similar] = await Promise.all([
    admin.auth.admin.getUserById(conv.particulier_id),
    admin.from("profiles").select("full_name").eq("id", conv.particulier_id).maybeSingle(),
    conv.vendor_id ? findSimilarVendors(admin, conv.vendor_id) : Promise.resolve([]),
  ]);
  const email = userRes?.user?.email;
  if (!email) {
    await markDone();
    return "skipped";
  }
  const fullName =
    (prof as { full_name: string | null } | null)?.full_name ?? conv.particulier_name;

  const { subject, html, text } = buildClientStalledEmail({
    base,
    clientFirstName: firstNameOf(fullName),
    vendorName: conv.vendor_name?.trim() || "ce prestataire",
    conversationId: conv.id,
    similar,
  });
  await sendEmail({ to: email, toName: fullName?.trim() || undefined, subject, html, text });
  await markDone();
  return "sent";
}

export type { AlertRow };
