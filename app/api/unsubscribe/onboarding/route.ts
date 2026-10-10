import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";
import { isValidUnsubscribeToken } from "@/lib/onboarding-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Désabonnement des relances d'inscription prestataire. POST uniquement
// (jamais GET : les antivirus de messagerie « cliquent » les liens et
// désabonneraient tout le monde). Deux appelants :
//   - le bouton de la page /desabonnement (formulaire → redirection),
//   - le désabonnement en un clic des messageries (RFC 8058, en-tête
//     List-Unsubscribe-Post) → simple 200.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") ?? "";
  const token = url.searchParams.get("t") ?? "";
  const base = siteUrl(request);

  const body = await request.text().catch(() => "");
  const isOneClick = body.includes("List-Unsubscribe=One-Click");

  const fail = () =>
    isOneClick
      ? NextResponse.json({ error: "Lien invalide." }, { status: 400 })
      : NextResponse.redirect(`${base}/desabonnement?erreur=1`, 303);

  if (!/^[0-9a-f-]{36}$/i.test(id) || !token) return fail();
  let valid = false;
  try {
    valid = isValidUnsubscribeToken(id, token);
  } catch (e) {
    console.error("unsubscribe-onboarding: secret manquant", e);
  }
  if (!valid) return fail();

  const admin = createAdminClient();
  const { error } = await admin
    .from("vendor_onboarding_reminders")
    .upsert(
      { vendor_profile_id: id, unsubscribed_at: new Date().toISOString() },
      { onConflict: "vendor_profile_id" }
    );
  if (error) {
    console.error("unsubscribe-onboarding: écriture échouée", id, error);
    return isOneClick
      ? NextResponse.json({ error: "Erreur." }, { status: 500 })
      : NextResponse.redirect(`${base}/desabonnement?erreur=1`, 303);
  }

  return isOneClick
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(`${base}/desabonnement?ok=1`, 303);
}
