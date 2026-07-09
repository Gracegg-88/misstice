"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";
import ModeSwitch from "@/components/ModeSwitch";
import NotificationBell from "@/components/NotificationBell";
import MobileNav from "@/components/MobileNav";
import { PRO_NAV } from "@/components/pro/nav";

export default function ProTopbar({
  name = "Mon activité",
  image = null,
  publicHref = "/prestataires",
}: {
  name?: string;
  image?: string | null;
  publicHref?: string;
}) {
  const [menu, setMenu] = useState(false);
  const router = useRouter();
  const initial = (name.trim()[0] || "P").toUpperCase();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth");
    router.refresh();
  };

  return (
    <header className="z-40 shrink-0 border-b border-black/5 bg-cream/80 backdrop-blur-md">
      <div className="flex min-h-16 items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-1.5">
          <MobileNav
            items={PRO_NAV}
            rootHref="/pro"
            homeHref={publicHref}
            homeLabel="Voir mon profil public"
            switchMode="pro"
          />
          <Logo />
          <span className="hidden rounded-md bg-violet px-2 py-0.5 text-xs font-semibold text-white sm:inline">
            Prestataire
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <ModeSwitch current="pro" />
          </div>
          <NotificationBell />
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
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-festif text-sm font-semibold text-white">
                  {initial}
                </span>
              )}
              <span className="hidden max-w-[9rem] truncate text-sm font-medium text-plum sm:block">
                {name}
              </span>
              <ChevronDown size={15} className="text-slate" />
            </button>
            {menu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenu(false)}
                />
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-black/5 bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-plum hover:bg-cream"
                  >
                    <LogOut size={16} className="text-slate" />
                    Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
