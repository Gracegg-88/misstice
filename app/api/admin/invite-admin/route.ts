import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient as createStandaloneClient } from "@supabase/supabase-js";
import { siteUrl } from "@/lib/site-url";
import { sendEmail, emailShell, escapeHtml, escapeAttr } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Mot de passe temporaire lisible (l'admin le changera après connexion).
function generatePassword(): string {
  // ~20 caractères base64url : entropie largement suffisante.
  return randomBytes(15).toString("base64").replace(/[+/=]/g, "").slice(0, 16) + "9aZ";
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
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
  const password = generatePassword();

  // Création du compte via un client ISOLÉ (pas de cookies) → ne touche pas la
  // session du super-admin. Le rôle est assaini par le trigger (jamais admin
  // à l'inscription) ; on promeut ensuite via une fonction SECURITY DEFINER.
  const anon = createStandaloneClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: signUp, error: signUpErr } = await anon.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (signUpErr) {
    const msg = signUpErr.message.includes("registered")
      ? "Un compte existe déjà avec cet email."
      : signUpErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const newId = signUp.user?.id;
  if (!newId) {
    return NextResponse.json(
      { error: "Création du compte impossible." },
      { status: 500 }
    );
  }

  // Promotion en admin (+ droit de gérer les admins si demandé), via la session
  // du super-admin appelant (is_super_admin() vérifié côté DB).
  const { error: promoteErr } = await supabase.rpc("sadmin_promote", {
    p_target: newId,
    p_can_manage: canManage,
  });
  if (promoteErr) {
    return NextResponse.json(
      { error: "Compte créé mais promotion échouée : " + promoteErr.message },
      { status: 500 }
    );
  }

  // Email d'invitation. URL de confiance (NEXT_PUBLIC_SITE_URL) car le lien
  // accompagne des identifiants → pas d'injection via l'en-tête Host.
  const loginUrl = `${siteUrl(request)}/auth`;

  const html = emailShell(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#1A1A2E">Bienvenue dans l'administration Misstice</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#6B7280">
      Un compte administrateur vient d'être créé pour vous${
        fullName ? `, ${escapeHtml(fullName)}` : ""
      }. Connectez-vous avec les identifiants ci-dessous, puis changez votre mot
      de passe depuis votre profil.
    </p>
    <div style="margin:0 0 20px;padding:16px;background:#F5F3FF;border-radius:12px;font-size:14px;color:#1A1A2E">
      <p style="margin:0 0 6px"><strong>Email :</strong> ${escapeHtml(email)}</p>
      <p style="margin:0"><strong>Mot de passe temporaire :</strong>
        <code style="font-size:15px">${escapeHtml(password)}</code></p>
    </div>
    <a href="${escapeAttr(loginUrl)}"
       style="display:inline-block;background:#6C3CE1;color:#fff;text-decoration:none;
              padding:13px 26px;border-radius:12px;font-weight:700;font-size:15px">
      Se connecter
    </a>
    <p style="margin:22px 0 0;font-size:12px;color:#9ca3af">
      Pour votre sécurité, modifiez ce mot de passe dès votre première connexion
      (Profil → Mot de passe).
    </p>`);

  const text =
    `Bienvenue dans l'administration Misstice.\n\n` +
    `Email : ${email}\nMot de passe temporaire : ${password}\n\n` +
    `Connectez-vous : ${loginUrl}\n` +
    `Pensez à changer votre mot de passe après connexion.\n\n— Misstice`;

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

  return NextResponse.json({ ok: true, mailFailed, password: mailFailed ? password : undefined });
}
