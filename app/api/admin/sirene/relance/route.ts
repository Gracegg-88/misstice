import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";

export const runtime = "nodejs";

// Relance manuelle d'une fiche vitrine non réclamée — jamais automatique,
// jamais de cron : uniquement ce bouton, cliqué par un admin, tant que les
// emails ne sont pas collectés en masse (contact_email reste rempli à la
// main). Le message varie selon tentatives_contact (singulier/pluriel,
// vrai chiffre — jamais d'estimation).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux admins." }, { status: 403 });
  }

  const { vendorId } = (await request.json().catch(() => ({}))) as { vendorId?: string };
  if (!vendorId) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: vendor } = await admin
    .from("vendors")
    .select("name, contact_email, claim_status, vues_fiche, tentatives_contact")
    .eq("id", vendorId)
    .maybeSingle();
  if (!vendor || vendor.claim_status !== "non_reclamee" || !vendor.contact_email) {
    return NextResponse.json(
      { error: "Fiche introuvable, déjà réclamée, ou sans email de contact renseigné." },
      { status: 400 }
    );
  }

  const phrase =
    vendor.tentatives_contact > 1
      ? `${vendor.tentatives_contact} personnes ont consulté votre fiche et essayé de vous contacter sur Misstice.`
      : vendor.tentatives_contact === 1
        ? "Quelqu'un a consulté votre fiche et essayé de vous contacter sur Misstice."
        : `Votre fiche a été vue ${vendor.vues_fiche} fois sur Misstice.`;

  const html = emailShell(`
    <h1 style="margin:0 0 12px;font-size:20px;color:#1E1B2E">${escapeHtml(vendor.name)}, votre fiche intéresse déjà des familles</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#1E1B2E">${escapeHtml(phrase)}</p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#1E1B2E">Misstice a repéré votre entreprise via le répertoire officiel des entreprises françaises et a créé une fiche vitrine pour vous. Réclamez-la gratuitement pour répondre aux demandes et être payé en toute sécurité.</p>
    <a href="https://www.misstice.com/devenir-prestataire" style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600;font-size:14px">Réclamer ma fiche</a>
  `);
  try {
    await sendEmail({
      to: vendor.contact_email,
      toName: vendor.name,
      subject: "Misstice — Votre entreprise suscite de l'intérêt",
      html,
      text: `${phrase} Réclamez votre fiche gratuitement : https://www.misstice.com/devenir-prestataire`,
    });
  } catch (e) {
    console.error("sirene-relance: envoi email échoué", vendorId, e);
    return NextResponse.json({ error: "L'envoi de l'email a échoué." }, { status: 500 });
  }

  await admin.rpc("mark_relance_sent", { p_vendor_id: vendorId });

  return NextResponse.json({ ok: true });
}
