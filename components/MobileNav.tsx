"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Home } from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

/** Tiroir de navigation mobile (les sidebars sont masquées en < lg). */
export default function MobileNav({
  items,
  rootHref,
  homeHref = "/",
  homeLabel = "Retour à l'accueil",
}: {
  items: NavItem[];
  rootHref: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  const isActive = (href: string) =>
    href === rootHref
      ? path === rootHref
      : path === href || path.startsWith(href + "/");

  return (
    <>
      <button
        type="button"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl text-plum lg:hidden"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-plum/40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col overflow-y-auto bg-white p-4 shadow-xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-plum"
              >
                <X size={18} />
              </button>
            </div>

            <nav
              className="flex flex-col gap-1"
              onClick={() => setOpen(false)}
            >
              {(items ?? []).map((item) => {
                const active = isActive(item.href);
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-violet text-white"
                        : "text-slate hover:bg-violet-soft hover:text-violet"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </a>
                );
              })}
            </nav>

            <a
              href={homeHref}
              onClick={() => setOpen(false)}
              className="mt-auto flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate hover:bg-violet-soft hover:text-violet"
            >
              <Home size={18} />
              {homeLabel}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
