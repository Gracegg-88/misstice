import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

// "Gérer mes informations bancaires" : génère un lien de connexion express
// à usage unique vers le tableau de bord Stripe du prestataire (pas de
// mot de passe séparé à gérer, pas d'interface à reconstruire nous-mêmes).
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

  const accountId = vendorProfile?.stripe_account_id as string | null | undefined;
  if (!accountId) {
    return NextResponse.redirect(`${origin}/pro/profil?stripe=no_account`);
  }

  try {
    const stripe = getStripe();
    const loginLink = await stripe.accounts.createLoginLink(accountId);
    return NextResponse.redirect(loginLink.url);
  } catch (e) {
    console.error("stripe-dashboard-link: échec", e);
    return NextResponse.redirect(`${origin}/pro/profil?stripe=error`);
  }
}
