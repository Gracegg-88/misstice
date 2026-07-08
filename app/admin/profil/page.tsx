import { redirect } from "next/navigation";
import ProfileForm from "@/components/admin/ProfileForm";
import { getProfile } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AdminProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect("/auth?next=/admin/profil");
  if (profile.role !== "admin") redirect("/");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        name={profile.full_name?.trim() || "Admin"}
        avatarUrl={profile.avatar_url}
        email={user?.email ?? ""}
      />
    </div>
  );
}
