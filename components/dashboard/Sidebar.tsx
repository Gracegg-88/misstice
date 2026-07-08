"use client";

import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { DASHBOARD_NAV as NAV } from "./nav";

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-hidden border-r border-black/5 bg-white lg:flex">
      <div className="flex flex-1 flex-col p-3">
        {/* Navigation — les items s'étirent pour remplir l'espace */}
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.href);
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors ${
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

        {/* Card retour à l'accueil */}
        <div className="relative mt-3 flex h-24 shrink-0 items-end overflow-hidden rounded-2xl ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sidebar_particulier.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <a
            href="/"
            className="relative z-10 flex w-full items-center justify-center gap-2 rounded-t-2xl bg-violet px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            <Home size={16} className="shrink-0" />
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </aside>
  );
}
