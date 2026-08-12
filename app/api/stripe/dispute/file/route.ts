import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { getAdminEmails } from "@/lib/admin-notify";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";
import { euro } from "@/lib/quote-doc";

export const runtime = "nodejs";

// Signalement d'un problème pendant la fenêtre de séquestre (jusqu'à
// escrow_event_date + 72h — vérifié côté base par file_quote_dispute).
// Règles automatiques prédéfinies (pas d'arbitrage humain à ce stade) :
//  • "prestataire_absent" → remboursement immédiat de la part prestataire
//    (85 %, la commission Misstice reste acquise) — cas non ambigu.
//  • "insatisfaction_qualite" → aucun remboursement automatique, litige
//    laissé ouvert pour médiation manuelle (voir /admin/devis).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { quoteId, reason, comment } = (await request.json().catch(() => ({}))) as {
    quoteId?: string;
    reason?: string;
    comment?: string;
  };
  if (
    !quoteId ||
    (reason !== "prestataire_absent" && reason !== "insatisfaction_qualite")
  ) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  // Borné pour rester lisible dans l'email et le panneau admin.
  const trimmedComment = (comment ?? "").trim().slice(0, 2000) || null;

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id, conversation_id, stripe_payment_intent_id, vendor_amount, amount, client_name, presta_name, quote_number"
    )
    .eq("id", quoteId)
    .maybeSingle();
  if (!quote || !quote.conversation_id) {
    return NextResponse.json({ error: "Devis introuvable." }, { status: 404 });
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select("particulier_id")
    .eq("id", quote.conversation_id)
    .maybeSingle();
  // Seule la famille peut signaler un problème sur son propre devis.
  if (!conversation || conversation.particulier_id !== user.id) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  const { data: ok, error: rpcErr } = await supabase.rpc("file_quote_dispute", {
    p_quote: quoteId,
    p_reason: reason,
    p_comment: trimmedComment,
  });
  if (rpcErr || ok === false) {
    return NextResponse.json(
      {
        error:
          rpcErr?.message ??
          "Impossible de signaler un problème sur ce devis (délai de 72h dépassé ou statut incompatible).",
      },
      { status: 400 }
    );
  }

  if (reason === "prestataire_absent") {
    if (!quote.stripe_payment_intent_id || quote.vendor_amount == null) {
      return NextResponse.json(
        {
          ok: true,
          status: "en litige",
          warning:
            "Litige enregistré, mais le remboursement automatique n'a pas pu être déclenché — l'équipe Misstice s'en charge manuellement.",
        }
      );
    }
    try {
      const stripe = getStripe();
      await stripe.refunds.create({
        payment_intent: quote.stripe_payment_intent_id,
        amount: Math.round(Number(quote.vendor_amount) * 100),
      });
    } catch (e) {
      console.error("dispute-file: échec remboursement Stripe", e);
      return NextResponse.json({
        ok: true,
        status: "en litige",
        warning:
          "Litige enregistré, mais le remboursement automatique a échoué — il sera traité manuellement.",
      });
    }
    const admin = createAdminClient();
    const { error: resolveErr } = await admin.rpc("resolve_quote_dispute", {
      p_quote: quoteId,
      p_refunded: true,
    });
    if (resolveErr) {
      console.error("dispute-file: resolve_quote_dispute échoué", resolveErr);
    }
    return NextResponse.json({ ok: true, status: "annulé" });
  }

  // "insatisfaction_qualite" nécessite une décision manuelle — sans email,
  // rien ne signale à l'équipe qu'un litige attend (visible uniquement en
  // allant sur /admin/devis). Best-effort : un échec d'envoi ne doit pas
  // faire échouer le signalement lui-même.
  try {
    const admin = createAdminClient();
    const emails = await getAdminEmails(admin);
    if (emails.length > 0) {
      const html = emailShell(`
        <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Nouveau litige à traiter</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
          ${escapeHtml(quote.client_name || "Un client")} a signalé une
          insatisfaction sur la prestation de
          ${escapeHtml(quote.presta_name || "un prestataire")}
          (${escapeHtml(quote.quote_number || "devis")}, ${euro(Number(quote.amount))}).
          Aucun remboursement automatique pour ce motif — une décision
          manuelle est nécessaire.
        </p>
        ${
          trimmedComment
            ? `<div style="margin:0 0 16px;padding:12px 14px;background:#F1ECFD;border-radius:12px;font-size:14px;color:#1A1A2E;white-space:pre-wrap">${escapeHtml(trimmedComment)}</div>`
            : ""
        }
        <a href="https://www.misstice.com/admin/devis"
           style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
                  padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
          Traiter le litige
        </a>`);
      for (const to of emails) {
        await sendEmail({
          to,
          subject: "Misstice — Nouveau litige à traiter",
          html,
          text: `${quote.client_name || "Un client"} a signalé une insatisfaction sur la prestation de ${quote.presta_name || "un prestataire"} (${quote.quote_number || "devis"}, ${euro(Number(quote.amount))}).${trimmedComment ? `\n\n"${trimmedComment}"` : ""}\n\nTraiter : https://www.misstice.com/admin/devis`,
        });
      }
    }
  } catch (e) {
    console.error("dispute-file: alerte admin échouée", e);
  }

  return NextResponse.json({ ok: true, status: "en litige" });
}
