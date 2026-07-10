import { redirect } from "next/navigation";
import ProfileForm from "@/components/admin/ProfileForm";
import { getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/auth?next=/dashboard/profil");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Champs personnels (peuvent être absents si la migration n'a pas tourné).
  const { data: extra } = await supabase
    .from("profiles")
    .select("birthdate, phone, newsletter_opt_in")
    .eq("id", profile.id)
    .maybeSingle();
  const e = (extra as {
    birthdate: string | null;
    phone: string | null;
    newsletter_opt_in: boolean | null;
  } | null) ?? null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-slate">
          Gérez vos informations personnelles et votre photo.
        </p>
      </div>

      <ProfileForm
        id={profile.id}
        name={profile.full_name?.trim() || ""}
        avatarUrl={profile.avatar_url}
        email={user?.email ?? ""}
        birthdate={e?.birthdate ?? null}
        phone={e?.phone ?? null}
        newsletter={e?.newsletter_opt_in ?? true}
        extras
      />
    </div>
  );
}
