import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";
import { getAdminEmails } from "@/lib/admin-notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

type WebhookPayload = {
  type?: string;
  table?: string;
  record?: {
    id?: string;
    company?: string;
    category?: string;
    city?: string;
  };
};

/**
 * Appelée par un Database Webhook Supabase (INSERT sur public.vendor_profiles,
 * configuré depuis le dashboard Supabase). Alerte les admins dès qu'un
 * nouveau prestataire s'inscrit, sans quoi une inscription pouvait passer
 * inaperçue tant que personne n'allait consulter /admin/prestataires.
 */
export async function POST(request: Request) {
  const secret = process.env.VENDOR_SIGNUP_WEBHOOK_SECRET;
  const header = request.headers.get("x-webhook-secret");
  if (!secret || !header || !safeEqual(header, secret)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const payload = (await request.json()) as WebhookPayload;
  if (payload.table !== "vendor_profiles" || payload.type !== "INSERT") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const company = payload.record?.company || "Un nouveau prestataire";
  const category = payload.record?.category || "";
  const city = payload.record?.city || "";

  try {
    const admin = createAdminClient();
    const emails = await getAdminEmails(admin);
    if (emails.length > 0) {
      const details = [category, city].filter(Boolean).join(" · ");
      const html = emailShell(`
        <h1 style="margin:0 0 8px;font-size:20px;color:#1A1A2E">Nouveau prestataire inscrit</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#6B7280">
          <strong>${escapeHtml(company)}</strong>${details ? ` (${escapeHtml(details)})` : ""}
          vient de créer un compte prestataire sur Misstice.
        </p>
        <a href="https://www.misstice.com/admin/prestataires"
           style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
                  padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
          Voir les prestataires
        </a>`);
      for (const to of emails) {
        await sendEmail({
          to,
          subject: `Misstice — Nouvelle inscription prestataire : ${company}`,
          html,
          text: `${company}${details ? ` (${details})` : ""} vient de créer un compte prestataire sur Misstice.\n\nVoir : https://www.misstice.com/admin/prestataires`,
        });
      }
    }
  } catch (e) {
    console.error("vendor-signup webhook: alerte admin échouée", e);
  }

  return NextResponse.json({ ok: true });
}
