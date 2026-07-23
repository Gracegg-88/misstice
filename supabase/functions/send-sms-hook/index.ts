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
  user: { phone?: string; new_phone?: string };
  sms: { otp: string; phone?: string };
};

// Format d'erreur attendu par Supabase pour un Auth Hook (contrairement à
// un succès, qui n'exige qu'un 200 avec un corps vide) : un texte brut
// n'est pas exploité correctement par GoTrue et produit des erreurs vides
// ou mal formées côté client (constaté en conditions réelles).
const hookError = (httpCode: number, message: string) =>
  new Response(JSON.stringify({ error: { http_code: httpCode, message } }), {
    status: httpCode,
    headers: { "content-type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return hookError(405, "Method not allowed");
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
    return hookError(401, "Invalid signature");
  }

  // Pour un ajout de téléphone à un compte existant (notre cas, via
  // updateUser({phone})), `user.phone` reste vide (c'est l'ancien numéro
  // confirmé, ici aucun) — le nouveau numéro en attente de confirmation
  // arrive dans `user.new_phone` et/ou `sms.phone` (confirmé par les logs
  // de la fonction). `user.phone` ne sert que pour le cas "inscription par
  // téléphone", où il est déjà peuplé du nouveau numéro dès le départ.
  const phone = payload.sms?.phone || payload.user?.new_phone || payload.user?.phone;
  const otp = payload.sms?.otp;
  if (!phone || !otp) {
    return hookError(400, "Payload incomplet");
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
    return hookError(500, `Échec de l'envoi du SMS : ${detail}`);
  }

  // Succès : corps vide accepté par Supabase, mais un en-tête Content-Type
  // reste exigé (son absence totale a provoqué une erreur "Missing
  // Content-Type header" en conditions réelles).
  return new Response(null, {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
