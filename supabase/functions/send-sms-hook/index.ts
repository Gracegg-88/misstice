// Supabase Auth "Send SMS Hook" — appelé par Supabase à chaque envoi d'OTP
// par SMS (vérification téléphone à l'inscription). Relaie vers l'API SMS
// transactionnelle de Brevo, pour rester sur le même fournisseur que les
// emails (voir lib/email.ts côté app Next.js).
//
// Secrets Supabase requis (à définir via `supabase secrets set`, PAS dans
// le .env Next.js — ce sont des secrets du projet Supabase, pas de Vercel) :
//   SEND_SMS_HOOK_SECRET  — secret du hook (Authentication → Hooks), format "v1,whsec_..."
//   BREVO_API_KEY         — clé API Brevo (SMTP & API → API Keys), différente de la clé SMTP
//
// Déploiement :
//   supabase functions deploy send-sms-hook --no-verify-jwt
// (--no-verify-jwt car Supabase appelle cette fonction côté serveur, sans JWT utilisateur)

import { Webhook } from "npm:standardwebhooks@1.0.0";

const HOOK_SECRET = Deno.env.get("SEND_SMS_HOOK_SECRET") ?? "";
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
// Nom d'expéditeur SMS (alphanumérique, 11 caractères max) — doit être
// approuvé côté Brevo selon les pays de destination.
const SENDER_NAME = Deno.env.get("BREVO_SMS_SENDER") ?? "Misstice";

type HookPayload = {
  user: { phone?: string };
  sms: { otp: string };
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await req.text();
  const headers = Object.fromEntries(req.headers);

  let payload: HookPayload;
  try {
    // Le secret du hook est fourni au format "v1,whsec_<base64>" ; la
    // librairie standardwebhooks attend uniquement le "whsec_<base64>".
    const wh = new Webhook(HOOK_SECRET.replace(/^v1,/, ""));
    payload = wh.verify(body, headers) as HookPayload;
  } catch (err) {
    console.error("send-sms-hook: signature invalide", err);
    return new Response("Invalid signature", { status: 401 });
  }

  // Diagnostic temporaire : la doc Supabase ne documente que le cas
  // "inscription par téléphone" (user.phone déjà peuplé du nouveau numéro).
  // Ici on ajoute un téléphone à un compte existant (updateUser({phone})) —
  // il faut voir la forme réelle reçue dans ce cas précis avant de corriger.
  console.log("send-sms-hook: payload reçu", JSON.stringify(payload));

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phone || !otp) {
    return new Response("Payload incomplet", { status: 400 });
  }

  const res = await fetch("https://api.brevo.com/v3/transactionalSMS/send", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: SENDER_NAME,
      recipient: phone.replace(/^\+/, ""), // Brevo attend le numéro sans le "+"
      content: `Votre code Misstice : ${otp}`,
      type: "transactional",
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("send-sms-hook: échec envoi Brevo", res.status, detail);
    return new Response("Échec de l'envoi du SMS", { status: 500 });
  }

  return new Response("ok", { status: 200 });
});
