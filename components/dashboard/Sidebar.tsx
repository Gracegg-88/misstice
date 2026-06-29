"use client";

import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Wallet,
  ListChecks,
  Users,
  Store,
  UsersRound,
  CalendarHeart,
  CalendarClock,
  Sparkles,
  Plus,
} from "lucide-react";

const NAV = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutGrid },
  { label: "Budget", href: "/dashboard/budget", icon: Wallet },
  { label: "Checklist", href: "/dashboard/checklist", icon: ListChecks },
  { label: "Invités", href: "/dashboard/invites", icon: Users },
  { label: "Prestataires", href: "/dashboard/prestataires", icon: Store },
  { label: "Équipe", href: "/dashboard/equipe", icon: UsersRound },
  { label: "Planning Jour J", href: "/dashboard/planning", icon: CalendarHeart },
  { label: "Agenda", href: "/dashboard/agenda", icon: CalendarClock },
  { label: "Inspiration", href: "/dashboard/inspiration", icon: Sparkles },
];

export default function Sidebar() {
  const path = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
      <div className="flex flex-1 flex-col p-4">
        {/* Événement en cours */}
        <div className="rounded-2xl bg-cream p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
            Événement en cours
          </p>
          <p className="mt-1 font-display text-base font-semibold text-plum">
            Mariage de Sophie &amp; Marc
          </p>
          <p className="text-xs text-slate">15 Juin 2026 · J-93</p>
        </div>

        {/* Navigation */}
        <nav className="mt-4 flex-1 space-y-1">
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
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
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

        {/* Bas */}
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-violet/40 py-2.5 text-sm font-semibold text-violet transition-colors hover:bg-violet-soft">
          <Plus size={16} />
          Nouvel événement
        </button>

        <div className="mt-4 rounded-2xl bg-cream p-3">
          <div className="flex justify-between text-xs">
            <span className="font-medium text-emerald">Progression globale</span>
            <span className="text-slate">65%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
            <div className="h-full w-[65%] rounded-full bg-emerald" />
          </div>
        </div>
      </div>
    </aside>
  );
}
