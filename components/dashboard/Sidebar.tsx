"use client";

import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { DASHBOARD_NAV as NAV } from "./nav";

export default function Sidebar({ unread = 0 }: { unread?: number }) {
  const path = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-hidden border-r border-black/5 bg-white lg:flex">
      <div className="flex flex-1 flex-col p-2">
        {/* Navigation — items compacts (comme l'admin), groupés en haut */}
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? path === "/dashboard"
                : path.startsWith(item.href);
            const badge = item.href === "/dashboard/messages" ? unread : 0;
            return (
              <a
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet text-white"
                    : "text-slate hover:bg-violet-soft hover:text-violet"
                }`}
              >
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {badge > 0 && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                      active ? "bg-white/25 text-white" : "bg-violet text-white"
                    }`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Card retour à l'accueil — poussée en bas */}
        <div className="relative mt-3 flex h-16 shrink-0 items-end overflow-hidden rounded-2xl ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sidebar_particulier.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <a
            href="/"
            className="relative z-10 flex w-full items-center justify-center gap-2 rounded-t-2xl bg-violet px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            <Home size={16} className="shrink-0" />
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </aside>
  );
}
