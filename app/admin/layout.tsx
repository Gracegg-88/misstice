import { redirect } from "next/navigation";
import Logo from "@/components/Logo";
import AdminNav from "@/components/admin/AdminNav";
import AdminUserMenu from "@/components/admin/AdminUserMenu";
import AdminMobileMenu from "@/components/admin/AdminMobileMenu";
import { getProfile } from "@/lib/queries";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/auth?next=/admin");
  if (profile.role !== "admin") redirect("/");

  const name = profile.full_name?.trim() || "Admin";

  return (
    <div className="flex h-screen flex-col bg-cream">
      {/* ── Topbar ── */}
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-black/5 bg-cream/80 px-4 py-2 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <AdminMobileMenu />
          <div className="flex min-w-0 items-center gap-1.5">
            <Logo />
            <span className="hidden rounded-md bg-violet px-2 py-0.5 text-xs font-semibold text-white sm:inline">
              Admin
            </span>
          </div>
        </div>
        <AdminUserMenu name={name} avatarUrl={profile.avatar_url} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar (compacte, sans scroll) ── */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
          <div className="p-4">
            <AdminNav />
          </div>
          {/* L'illustration remplit tout l'espace restant, bord à bord */}
          <div className="relative flex-1 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sidebar.png"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </aside>

        {/* ── Contenu (seule zone qui défile) ── */}
        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
