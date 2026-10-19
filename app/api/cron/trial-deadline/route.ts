import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { trialQuoteActions } from "@/lib/trial-deadline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

type PendingRow = {
  id: string;
  presta_name: string | null;
  presta_email: string | null;
  client_name: string | null;
  client_email: string | null;
  event_label: string | null;
  escrow_event_date: string | null;
  trial_confirmation_deadline: string | null;
  trial_reminder_j3_sent_at: string | null;
  trial_reminder_j1_sent_at: string | null;
};

/**
 * Tâche quotidienne (voir vercel.json) : un devis "en attente de
 * confirmation" (rencontre préalable — Traiteur, Robe & Tenue, Coiffure &
 * Maquillage) ne doit jamais rester bloqué si le client ne répond jamais.
 * Relance le client à J-3 et J-1 de la date limite (trial_confirmation_
 * deadline, calculée au paiement — voir mark_quote_paid), puis confirme
 * automatiquement passé cette date (ou si l'événement est déjà passé),
 * comme si le client avait cliqué "Confirmer après rencontre".
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const base = siteUrl(request);
  const now = new Date();

  const { data, error: fetchErr } = await admin.rpc(
    "quotes_pending_trial_confirmation"
  );
  if (fetchErr) {
    console.error("trial-deadline fetch:", fetchErr);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }

  const rows = (data as PendingRow[]) ?? [];

  let confirmed = 0;
  let remindedJ3 = 0;
  let remindedJ1 = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      const actions = trialQuoteActions({
        now,
        escrowEventDate: row.escrow_event_date,
        deadline: row.trial_confirmation_deadline,
        j3SentAt: row.trial_reminder_j3_sent_at,
        j1SentAt: row.trial_reminder_j1_sent_at,
      });

      const quoteUrl = `${base}/devis/${row.id}`;
      const prestaName = row.presta_name || "votre prestataire";
      const eventLabel = row.event_label || "votre événement";
      const clientName = row.client_name?.trim().split(/\s+/)[0] || "";

      if (actions.overdue) {
        const { error: rpcErr } = await admin.rpc("auto_confirm_quote_trial", {
          p_quote: row.id,
        });
        if (rpcErr) throw rpcErr;
        confirmed += 1;

        if (row.client_email) {
          await sendEmail({
            to: row.client_email,
            toName: row.client_name || undefined,
            subject: "Misstice — Réservation confirmée automatiquement",
            html: emailShell(`
              <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Réservation confirmée</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
                ${escapeHtml(clientName || "Bonjour")}, n'ayant pas reçu de réponse avant
                la date limite suite à votre rencontre avec ${escapeHtml(prestaName)}, la
                réservation pour ${escapeHtml(eventLabel)} a été confirmée automatiquement
                et suit maintenant son cours normal.
              </p>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
                Un problème avec ce prestataire ? Vous pouvez encore signaler une
                difficulté depuis votre devis.
              </p>
              <a href="${quoteUrl}" style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600">Voir mon devis</a>`),
            text: `Votre réservation avec ${prestaName} pour ${eventLabel} a été confirmée automatiquement, sans réponse reçue avant la date limite. Voir le devis : ${quoteUrl}`,
          });
        }
        if (row.presta_email) {
          await sendEmail({
            to: row.presta_email,
            toName: row.presta_name || undefined,
            subject: "Misstice — Devis confirmé automatiquement",
            html: emailShell(`
              <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Devis confirmé ✔</h1>
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
                Le client n'a pas répondu avant la date limite suite à votre rencontre :
                le devis "${escapeHtml(eventLabel)}" est confirmé automatiquement et suit
                le cycle normal du séquestre jusqu'à la libération des fonds.
              </p>
              <a href="${quoteUrl}" style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600">Voir le devis</a>`),
            text: `Le client n'a pas répondu avant la date limite : le devis "${eventLabel}" est confirmé automatiquement. Voir le devis : ${quoteUrl}`,
          });
        }
        continue;
      }

      if (actions.needsJ3 && row.client_email) {
        await sendEmail({
          to: row.client_email,
          toName: row.client_name || undefined,
          subject: `Misstice — Confirmez votre réservation avec ${prestaName}`,
          html: emailShell(`
            <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Il reste 3 jours</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
              ${escapeHtml(clientName || "Bonjour")}, après votre rencontre avec
              ${escapeHtml(prestaName)}, il ne reste que 3 jours pour confirmer votre
              réservation pour ${escapeHtml(eventLabel)}. Sans réponse de votre part, elle
              sera confirmée automatiquement.
            </p>
            <a href="${quoteUrl}" style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600">Confirmer ou annuler</a>`),
          text: `Il reste 3 jours pour confirmer votre réservation avec ${prestaName} (${eventLabel}), sans quoi elle sera confirmée automatiquement. ${quoteUrl}`,
        });
        const { error: rpcErr } = await admin.rpc(
          "set_quote_trial_reminder_sent",
          { p_quote: row.id, p_which: "j3" }
        );
        if (rpcErr) throw rpcErr;
        remindedJ3 += 1;
      }

      if (actions.needsJ1 && row.client_email) {
        await sendEmail({
          to: row.client_email,
          toName: row.client_name || undefined,
          subject: `Misstice — Dernier jour pour confirmer avec ${prestaName}`,
          html: emailShell(`
            <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Dernier jour</h1>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
              ${escapeHtml(clientName || "Bonjour")}, c'est le dernier jour pour confirmer
              ou annuler votre réservation avec ${escapeHtml(prestaName)} pour
              ${escapeHtml(eventLabel)}. Sans réponse d'ici demain, elle sera confirmée
              automatiquement et le prestataire sera payé normalement.
            </p>
            <a href="${quoteUrl}" style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-size:14px;font-weight:600">Confirmer ou annuler</a>`),
          text: `Dernier jour pour confirmer ou annuler votre réservation avec ${prestaName} (${eventLabel}) avant confirmation automatique. ${quoteUrl}`,
        });
        const { error: rpcErr } = await admin.rpc(
          "set_quote_trial_reminder_sent",
          { p_quote: row.id, p_which: "j1" }
        );
        if (rpcErr) throw rpcErr;
        remindedJ1 += 1;
      }
    } catch (e) {
      console.error("trial-deadline:", row.id, e);
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    confirmed,
    remindedJ3,
    remindedJ1,
    failed,
  });
}
