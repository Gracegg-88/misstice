import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";
import { sendEmail, emailShell, escapeHtml, escapeAttr } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!rateLimit(`invite-admin:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  // Seul un super-admin (can_manage_admins) peut inviter d'autres admins.
  const { data: me } = await supabase
    .from("profiles")
    .select("role, can_manage_admins")
    .eq("id", user.id)
    .maybeSingle();
  const meRow = me as { role: string; can_manage_admins: boolean } | null;
  if (!meRow || meRow.role !== "admin" || !meRow.can_manage_admins) {
    return NextResponse.json({ error: "Réservé aux super-admins." }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const email = String(body.email ?? "").trim().toLowerCase();
  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const canManage = body.canManage === true;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide." }, { status: 400 });
  }

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || null;

  // Client SERVICE-ROLE (serveur uniquement) : création de compte fiable.
  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  // 1. Création du compte, DÉJÀ CONFIRMÉ (donc connectable). Contrairement à
  //    signUp, createUser renvoie une VRAIE erreur sur doublon (HIGH-3).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createErr || !created?.user) {
    const raw = createErr?.message ?? "";
    const msg = /already|registered|exists/i.test(raw)
      ? "Un compte existe déjà avec cet email."
      : raw || "Création du compte impossible.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const newId = created.user.id;

  // 2. Promotion en admin via la session du super-admin (is_super_admin vérifié).
  const { error: promoteErr } = await supabase.rpc("sadmin_promote", {
    p_target: newId,
    p_can_manage: canManage,
  });
  if (promoteErr) {
    // On nettoie le compte à moitié créé pour éviter un état incohérent.
    await admin.auth.admin.deleteUser(newId).catch(() => {});
    return NextResponse.json(
      { error: "Promotion échouée : " + promoteErr.message },
      { status: 500 }
    );
  }

  // 3. Lien de DÉFINITION du mot de passe (HIGH-10 : aucun mot de passe en clair).
  const base = siteUrl(request);
  let actionLink = `${base}/auth`;
  const { data: linkData } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: `${base}/auth/confirm?next=/auth/reset` },
  });
  const generated = (
    linkData as { properties?: { action_link?: string } } | null
  )?.properties?.action_link;
  if (generated) actionLink = generated;

  // 4. Email d'invitation (lien, pas d'identifiants en clair).
  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1A1A2E">Bienvenue dans l'administration Misstice</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6B7280">
      Un accès administrateur vient d'être créé pour vous${
        fullName ? `, ${escapeHtml(fullName)}` : ""
      }. Cliquez ci-dessous pour définir votre mot de passe et vous connecter.
    </p>
    <a href="${escapeAttr(actionLink)}"
       style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
              padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
      Définir mon mot de passe
    </a>
    <p style="margin:22px 0 0;font-size:12px;color:#9ca3af">
      Ce lien est personnel et à usage unique. Si vous n'attendiez pas cette
      invitation, ignorez cet e-mail.
    </p>`);

  const text =
    `Bienvenue dans l'administration Misstice.\n\n` +
    `Définissez votre mot de passe : ${actionLink}\n\n— Misstice`;

  let mailFailed = false;
  try {
    await sendEmail({
      to: email,
      toName: fullName ?? undefined,
      subject: "Votre accès administrateur Misstice",
      html,
      text,
    });
  } catch (e) {
    console.error("invite-admin mail:", e);
    mailFailed = true;
  }

  // On ne renvoie JAMAIS de secret. En cas d'échec d'envoi, le super-admin peut
  // relancer l'invitation (ou l'invité utilise « mot de passe oublié »).
  return NextResponse.json({ ok: true, mailFailed });
}
