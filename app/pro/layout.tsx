import { redirect } from "next/navigation";
import ProTopbar from "@/components/pro/ProTopbar";
import ProSidebar from "@/components/pro/ProSidebar";
import { getProfile } from "@/lib/queries";
import { getMyVendor } from "@/lib/pro";

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

  const vendor = await getMyVendor();
  const name = vendor?.company || profile.full_name?.trim() || "Mon activité";
  const publicHref = vendor?.vendorId
    ? `/prestataires/${vendor.vendorId}`
    : "/prestataires";

  return (
    <div className="flex h-screen flex-col bg-cream">
      <ProTopbar name={name} image={vendor?.image ?? null} />
      <div className="flex flex-1 overflow-hidden">
        <ProSidebar
          name={name}
          category={vendor?.category ?? null}
          city={vendor?.city ?? null}
          verified={vendor?.verified ?? false}
          image={vendor?.image ?? null}
          publicHref={publicHref}
        />
        <main className="min-w-0 flex-1 overflow-y-auto px-5 py-8 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
