import { redirect } from "next/navigation";
import ProfilClient from "@/components/pro/ProfilClient";
import ProfileForm from "@/components/admin/ProfileForm";
import DeleteAccountButton from "@/components/dashboard/DeleteAccountButton";
import SiretVerification from "@/components/pro/SiretVerification";
import StripeConnectStatus from "@/components/pro/StripeConnectStatus";
import GooglePlaceLinker from "@/components/google/GooglePlaceLinker";
import { getMyVendor, getMyPackages, getMyPhotos } from "@/lib/pro";
import { getProfile } from "@/lib/queries";
import { getCategories } from "@/lib/vendors";
import { createClient } from "@/lib/supabase/server";
import type { ProVendor } from "@/lib/pro-types";

export default async function ProProfilPage() {
  const vendor = await getMyVendor();
  const categories = await getCategories();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/pro/profil");
  const profile = await getProfile();

  // Informations de connexion (email, mot de passe) + suppression de compte —
  // communes à tout compte, mêmes composants que côté particulier
  // (app/dashboard/profil/page.tsx).
  const accountSection = (
    <div className="mx-auto mt-8 max-w-3xl space-y-6">
      <ProfileForm
        id={user.id}
        name={profile?.full_name?.trim() || ""}
        avatarUrl={profile?.avatar_url ?? null}
        email={user.email ?? ""}
      />
      <DeleteAccountButton />
    </div>
  );

  // Pas encore de fiche : on affiche quand même le formulaire pour la créer.
  if (!vendor) {
    const shell: ProVendor = {
      profileId: user.id,
      vendorId: null,
      company: profile?.full_name?.trim() || "",
      category: "",
      city: "",
      about: "",
      tagline: "",
      priceFrom: "",
      image: null,
      verified: false,
      rating: 0,
      reviews: 0,
      moods: [],
      energies: [],
      lights: [],
      palettes: [],
      atmospheres: [],
      music: [],
    };

    return (
      <div>
        <div className="mx-auto mb-4 max-w-4xl rounded-2xl border border-violet/15 bg-violet-soft px-5 py-3 text-sm text-violet">
          Bienvenue&nbsp;! Renseignez vos informations ci-dessous puis
          «&nbsp;Enregistrer&nbsp;» pour activer votre fiche publique.
        </div>
        <ProfilClient
          vendor={shell}
          packages={[]}
          photos={[]}
          categories={categories}
        />
        {accountSection}
      </div>
    );
  }

  const [packages, photos, { data: vendorProfileRow }, googleRes] = await Promise.all([
    getMyPackages(),
    getMyPhotos(),
    supabase
      .from("vendor_profiles")
      .select("siret, siret_verified_at, siret_company_name, stripe_onboarding_status")
      .eq("id", user.id)
      .maybeSingle(),
    // Requête séparée et tolérante (colonnes ajoutées par supabase/google-places.sql).
    supabase
      .from("vendors")
      .select("google_place_id, google_place_status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const google = googleRes.error
    ? null
    : (googleRes.data as {
        google_place_id: string | null;
        google_place_status: "a_valider" | "valide" | null;
      } | null);
  const siretInfo = vendorProfileRow as {
    siret: string | null;
    siret_verified_at: string | null;
    siret_company_name: string | null;
  } | null;
  const stripeStatus =
    (vendorProfileRow as { stripe_onboarding_status?: "non_demarre" | "en_attente" | "actif" } | null)
      ?.stripe_onboarding_status ?? "non_demarre";

  return (
    <div>
      <ProfilClient
        vendor={vendor}
        packages={packages}
        photos={photos}
        categories={categories}
      />
      <div className="mx-auto max-w-3xl">
        <SiretVerification
          siret={siretInfo?.siret ?? null}
          verifiedAt={siretInfo?.siret_verified_at ?? null}
          companyName={siretInfo?.siret_company_name ?? null}
        />
        <StripeConnectStatus status={stripeStatus} />
        {!googleRes.error && (
          <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-lg font-semibold text-plum">
              Connecter ma fiche Google
            </h2>
            <p className="mt-1 text-sm text-slate">
              Affichez votre note Google sur votre fiche Misstice, dans un
              encadré séparé de vos avis Misstice. Retrouvez votre entreprise,
              confirmez qu&apos;il s&apos;agit bien d&apos;elle : notre équipe
              valide le lien avant sa mise en ligne.
            </p>
            <div className="mt-4">
              <GooglePlaceLinker
                mode="pro"
                defaultQuery={`${vendor.company} ${vendor.city}`.trim()}
                placeId={google?.google_place_id ?? null}
                status={google?.google_place_status ?? null}
              />
            </div>
          </div>
        )}
      </div>
      {accountSection}
    </div>
  );
}
