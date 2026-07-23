import { redirect } from "next/navigation";
import ProfilClient from "@/components/pro/ProfilClient";
import ProfileForm from "@/components/admin/ProfileForm";
import DeleteAccountButton from "@/components/dashboard/DeleteAccountButton";
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

  const [packages, photos] = await Promise.all([getMyPackages(), getMyPhotos()]);

  return (
    <div>
      <ProfilClient
        vendor={vendor}
        packages={packages}
        photos={photos}
        categories={categories}
      />
      {accountSection}
    </div>
  );
}
