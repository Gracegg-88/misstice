"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Menu, X, Home } from "lucide-react";
import ModeSwitch from "@/components/ModeSwitch";

type NavItem = { label: string; href: string; icon: React.ElementType };

/** Menu de navigation mobile en modale (les sidebars sont masquées en < lg). */
export default function MobileNav({
  items,
  rootHref,
  homeHref = "/",
  homeLabel = "Retour à l'accueil",
  switchMode,
}: {
  items: NavItem[];
  rootHref: string;
  homeHref?: string;
  homeLabel?: string;
  switchMode?: "pro" | "particulier";
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

      {open && createPortal(
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 lg:hidden">
          <div
            className="absolute inset-0 bg-plum/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-plum">Menu</span>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-plum"
              >
                <X size={18} />
              </button>
            </div>

            {switchMode && (
              <div
                className="mb-3 flex justify-center"
                onClick={() => setOpen(false)}
              >
                <ModeSwitch current={switchMode} />
              </div>
            )}

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
              className="mt-3 flex items-center gap-2.5 rounded-xl border-t border-black/5 px-3 py-2.5 pt-4 text-sm font-medium text-slate hover:bg-violet-soft hover:text-violet"
            >
              <Home size={18} />
              {homeLabel}
            </a>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
