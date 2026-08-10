import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// Démarre ou reprend l'inscription Stripe Express du prestataire connecté.
// Visitée en navigation directe (lien <a>, pas fetch) : redirige toujours,
// jamais de JSON. Réutilise le compte Stripe existant s'il y en a déjà un
// (pas de duplication à chaque clic).
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/auth?next=/pro/profil`);
  }

  const { data: vendorProfile } = await supabase
    .from("vendor_profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!vendorProfile) {
    // Pas encore de fiche prestataire créée : rien à relier à Stripe.
    return NextResponse.redirect(`${origin}/pro/profil?stripe=no_profile`);
  }

  const stripe = getStripe();
  const admin = createAdminClient();
  let accountId = vendorProfile.stripe_account_id as string | null;

  try {
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "FR",
        email: user.email ?? undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: "individual",
      });
      accountId = account.id;
      // Enregistré immédiatement : si le prestataire abandonne avant la fin
      // du formulaire Stripe, on réutilise ce même compte au prochain clic
      // plutôt que d'en recréer un.
      const { error: rpcErr } = await admin.rpc("set_stripe_account_status", {
        p_profile_id: user.id,
        p_account_id: accountId,
        p_status: "en_attente",
        p_payouts_enabled: false,
      });
      if (rpcErr) throw rpcErr;
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/api/stripe/connect/onboard`,
      return_url: `${origin}/pro/profil?stripe=return`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);
  } catch (e) {
    console.error("stripe-onboard: échec", e);
    return NextResponse.redirect(`${origin}/pro/profil?stripe=error`);
  }
}
