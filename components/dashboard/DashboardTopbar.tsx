"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import ModeSwitch from "@/components/ModeSwitch";
import NotificationBell from "@/components/NotificationBell";
import MobileNav from "@/components/MobileNav";
import { DASHBOARD_NAV } from "@/components/dashboard/nav";
import EventSwitcher from "@/components/dashboard/EventSwitcher";

type Ev = { id: string; name: string; event_date: string | null };

export default function DashboardTopbar({
  name,
  role,
  image = null,
  events = [],
  currentEventId = null,
}: {
  name?: string;
  role?: string;
  image?: string | null;
  events?: Ev[];
  currentEventId?: string | null;
}) {
  const [menu, setMenu] = useState(false);
  const router = useRouter();

  const displayName = name?.trim() || "Mon compte";
  const initial = displayName.charAt(0).toUpperCase();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="z-40 shrink-0 border-b border-black/5 bg-cream/80 backdrop-blur-md">
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <MobileNav
            items={DASHBOARD_NAV}
            rootHref="/dashboard"
            switchMode={
              role === "prestataire" || role === "admin"
                ? "particulier"
                : undefined
            }
          />
          <Logo />
          {(role === "prestataire" || role === "admin") && (
            <span className="hidden rounded-md bg-violet px-2 py-0.5 text-xs font-semibold text-white sm:inline">
              Particulier
            </span>
          )}
          <EventSwitcher events={events} currentId={currentEventId} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Bascule d'espace — comptes ayant aussi un espace pro. */}
          {(role === "prestataire" || role === "admin") && (
            <div className="hidden sm:block">
              <ModeSwitch current="particulier" />
            </div>
          )}

          <NotificationBell />

          {/* Menu utilisateur */}
          <div className="relative">
          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-2 py-1.5 hover:border-black/10"
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="h-7 w-7 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet text-sm font-semibold text-white">
                {initial}
              </span>
            )}
            <span className="hidden max-w-[9rem] truncate text-sm font-medium text-plum sm:block">
              {displayName}
            </span>
            <ChevronDown size={15} className="text-slate" />
          </button>

          {menu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-black/5 bg-white p-1.5 shadow-lg">
              <a
                href="/dashboard/profil"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-plum hover:bg-cream"
              >
                <User size={16} className="text-slate" />
                Profil
              </a>
              {role === "admin" && (
                <a
                  href="/admin"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet hover:bg-violet-soft"
                >
                  <ShieldCheck size={16} />
                  Espace admin
                </a>
              )}
              <button
                type="button"
                onClick={signOut}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-plum hover:bg-cream"
              >
                <LogOut size={16} className="text-slate" />
                Se déconnecter
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
