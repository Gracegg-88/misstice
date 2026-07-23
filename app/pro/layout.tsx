import { redirect } from "next/navigation";
import ProTopbar from "@/components/pro/ProTopbar";
import ProSidebar from "@/components/pro/ProSidebar";
import { getProfile } from "@/lib/queries";
import { getMyVendor } from "@/lib/pro";
import { getUnreadTotal } from "@/lib/messaging";
import { createClient } from "@/lib/supabase/server";

export default async function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/auth?next=/pro");
  if (profile.role !== "prestataire" && profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Filet de sécurité : un prestataire arrivé sans passer par le stepper
  // d'inscription (ex. via Google) n'a jamais vérifié son téléphone.
  if (profile.role === "prestataire") {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("phone_verified_at")
      .eq("id", profile.id)
      .maybeSingle();
    if (!(data as { phone_verified_at: string | null } | null)?.phone_verified_at) {
      redirect("/verifier-telephone");
    }
  }

  const [vendor, unread] = await Promise.all([getMyVendor(), getUnreadTotal()]);
  const name = vendor?.company || profile.full_name?.trim() || "Mon activité";
  const publicHref = vendor?.vendorId
    ? `/prestataires/${vendor.vendorId}`
    : "/prestataires";

  return (
    <div className="flex h-screen flex-col bg-cream">
      <ProTopbar name={name} image={vendor?.image ?? null} publicHref={publicHref} />
      <div className="flex flex-1 overflow-hidden">
        <ProSidebar
          name={name}
          category={vendor?.category ?? null}
          city={vendor?.city ?? null}
          verified={vendor?.verified ?? false}
          image={vendor?.image ?? null}
          publicHref={publicHref}
          unread={unread}
        />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
