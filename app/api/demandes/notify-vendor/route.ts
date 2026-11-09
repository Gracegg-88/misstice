import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import { siteUrl } from "@/lib/site-url";
import { sendVendorPayoutsAlert } from "@/lib/payouts-alerts";

export const runtime = "nodejs";

/**
 * Appelée par la famille juste après l'envoi d'une demande de devis (voir
 * VendorProfile). Si le prestataire n'a pas activé ses paiements, il reçoit
 * l'email « Vous avez une demande de …, activez vos paiements pour y
 * répondre ». Idempotent (une seule fois par demande, voir
 * lib/payouts-alerts.ts) ; le cron /api/cron/stalled-requests rattrape les
 * envois manqués.
 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  if (!rateLimit(`demande-notify:${user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });
  }

  const { conversationId } = (await request.json().catch(() => ({}))) as {
    conversationId?: string;
  };
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation manquante." }, { status: 400 });
  }

  // Lecture avec la session de l'utilisateur : seule la famille de la
  // conversation peut déclencher l'alerte.
  const { data: conv } = await supabase
    .from("conversations")
    .select("id, particulier_id")
    .eq("id", conversationId)
    .maybeSingle();
  if (!conv || conv.particulier_id !== user.id) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }

  try {
    const result = await sendVendorPayoutsAlert(
      createAdminClient(),
      conversationId,
      siteUrl(request)
    );
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("demande-notify: envoi échoué", conversationId, e);
    return NextResponse.json({ error: "Envoi échoué." }, { status: 500 });
  }
}
