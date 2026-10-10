import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site-url";
import { buildReminderEmail, isReminderDue } from "@/lib/onboarding-reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Garde-fou : nombre maximal d'emails par exécution (le reste part le
// lendemain, le calendrier se base sur la date du dernier envoi).
const MAX_SENDS_PER_RUN = 200;

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

type VendorRow = {
  id: string;
  created_at: string;
  siret_verified_at: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_status: string | null;
};
type ReminderRow = {
  vendor_profile_id: string;
  sent_count: number;
  last_sent_at: string | null;
  unsubscribed_at: string | null;
};

/**
 * Tâche quotidienne (voir vercel.json) : relance par email les prestataires
 * dont l'inscription n'est pas finalisée (SIRET non vérifié et/ou compte
 * Stripe non actif). J+3, J+7, puis tous les 5 jours, jusqu'à finalisation
 * ou désabonnement (lien en pied d'email). Voir lib/onboarding-reminders.ts.
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
  const now = new Date();

  const { data: vendorData, error: vendorErr } = await admin
    .from("vendor_profiles")
    .select(
      "id, created_at, siret_verified_at, stripe_account_id, stripe_onboarding_status"
    )
    .or(
      "siret_verified_at.is.null,stripe_onboarding_status.is.null,stripe_onboarding_status.neq.actif"
    );
  if (vendorErr) {
    console.error("onboarding-reminders: lecture prestataires", vendorErr);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }
  const vendors = (vendorData as VendorRow[]) ?? [];
  if (vendors.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0 });
  }

  const ids = vendors.map((v) => v.id);
  const [{ data: reminderData, error: remErr }, { data: profileData, error: profErr }] =
    await Promise.all([
      admin
        .from("vendor_onboarding_reminders")
        .select("vendor_profile_id, sent_count, last_sent_at, unsubscribed_at")
        .in("vendor_profile_id", ids),
      admin.from("profiles").select("id, full_name, role").in("id", ids),
    ]);
  if (remErr || profErr) {
    console.error("onboarding-reminders: lecture suivi/profils", remErr ?? profErr);
    return NextResponse.json({ error: "Lecture échouée." }, { status: 500 });
  }

  const reminders = new Map(
    ((reminderData as ReminderRow[]) ?? []).map((r) => [r.vendor_profile_id, r])
  );
  const profiles = new Map(
    (
      (profileData as { id: string; full_name: string | null; role: string }[]) ?? []
    ).map((p) => [p.id, p])
  );

  let sent = 0;
  let failed = 0;

  for (const v of vendors) {
    if (sent >= MAX_SENDS_PER_RUN) break;

    const profile = profiles.get(v.id);
    // Seuls les comptes prestataires sont concernés (pas les admins).
    if (!profile || profile.role !== "prestataire") continue;

    const rem = reminders.get(v.id);
    if (rem?.unsubscribed_at) continue;

    const sentCount = rem?.sent_count ?? 0;
    const due = isReminderDue({
      signupAt: new Date(v.created_at),
      sentCount,
      lastSentAt: rem?.last_sent_at ? new Date(rem.last_sent_at) : null,
      now,
    });
    if (!due) continue;

    try {
      const { data: userRes, error: userErr } =
        await admin.auth.admin.getUserById(v.id);
      const email = userRes?.user?.email;
      if (userErr || !email) continue;

      const firstName = profile.full_name?.trim().split(/\s+/)[0] || null;
      const { subject, html, text, headers } = buildReminderEmail({
        base,
        vendorProfileId: v.id,
        firstName,
        missingSiret: !v.siret_verified_at,
        missingStripe: v.stripe_onboarding_status !== "actif",
        stripeStarted: Boolean(v.stripe_account_id),
        reminderNumber: sentCount + 1,
      });

      await sendEmail({
        to: email,
        toName: profile.full_name?.trim() || undefined,
        subject,
        html,
        text,
        headers,
      });

      const { error: upErr } = await admin
        .from("vendor_onboarding_reminders")
        .upsert(
          {
            vendor_profile_id: v.id,
            sent_count: sentCount + 1,
            last_sent_at: now.toISOString(),
          },
          { onConflict: "vendor_profile_id" }
        );
      if (upErr) {
        // L'email est parti mais le suivi a échoué : on arrête pour ne pas
        // risquer de renvoyer en boucle demain à tout le monde.
        console.error("onboarding-reminders: écriture suivi", v.id, upErr);
        return NextResponse.json(
          { error: "Écriture du suivi échouée.", sent: sent + 1, failed },
          { status: 500 }
        );
      }
      sent += 1;
    } catch (e) {
      console.error("onboarding-reminders: envoi échoué", v.id, e);
      failed += 1;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
