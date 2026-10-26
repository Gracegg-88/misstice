import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteUrl } from "@/lib/site-url";
import {
  CLIENT_ALERT_DELAY_HOURS,
  sendClientStalledAlert,
  sendVendorPayoutsAlert,
  type AlertRow,
} from "@/lib/payouts-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Garde-fou : nombre maximal d'emails par exécution (le reste part au
// prochain passage).
const MAX_SENDS_PER_RUN = 200;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Tâche planifiée (voir vercel.json) sur les demandes de devis adressées à un
 * prestataire sans paiements Stripe actifs (suivi : quote_request_alerts) :
 *  - rattrape l'email au prestataire s'il n'est pas parti à la demande ;
 *  - 72 h après la demande, si le prestataire n'a toujours pas activé ses
 *    paiements ni envoyé de devis, prévient le client et lui propose
 *    3 prestataires similaires (même catégorie, même ville).
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
  const cutoff = new Date(Date.now() - CLIENT_ALERT_DELAY_HOURS * 3_600_000).toISOString();

  const [vendorPending, clientDue] = await Promise.all([
    admin
      .from("quote_request_alerts")
      .select("conversation_id, requested_at, vendor_alert_sent_at, client_alert_sent_at")
      .is("vendor_alert_sent_at", null)
      .gt("requested_at", cutoff)
      .limit(MAX_SENDS_PER_RUN),
    admin
      .from("quote_request_alerts")
      .select("conversation_id, requested_at, vendor_alert_sent_at, client_alert_sent_at")
      .is("client_alert_sent_at", null)
      .lte("requested_at", cutoff)
      .order("requested_at", { ascending: true })
      .limit(MAX_SENDS_PER_RUN),
  ]);
  if (vendorPending.error || clientDue.error) {
    console.error("stalled-requests: lecture", vendorPending.error ?? clientDue.error);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;

  for (const row of (vendorPending.data as AlertRow[]) ?? []) {
    if (sent >= MAX_SENDS_PER_RUN) break;
    try {
      if ((await sendVendorPayoutsAlert(admin, row.conversation_id, base)) === "sent") sent += 1;
    } catch (e) {
      console.error("stalled-requests: alerte prestataire", row.conversation_id, e);
      failed += 1;
    }
  }

  for (const row of (clientDue.data as AlertRow[]) ?? []) {
    if (sent >= MAX_SENDS_PER_RUN) break;
    try {
      if ((await sendClientStalledAlert(admin, row, base)) === "sent") sent += 1;
    } catch (e) {
      console.error("stalled-requests: alerte client", row.conversation_id, e);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
