"use client";

import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Store,
  Inbox,
  FileText,
  MessageSquare,
  CalendarDays,
  BarChart3,
  BadgeCheck,
  ExternalLink,
} from "lucide-react";

const NAV = [
  { label: "Tableau de bord", href: "/pro", icon: LayoutGrid },
  { label: "Mon profil", href: "/pro/profil", icon: Store },
  { label: "Demandes de devis", href: "/pro/demandes", icon: Inbox, badge: 2 },
  { label: "Mes devis", href: "/pro/devis", icon: FileText },
  { label: "Messagerie", href: "/pro/messagerie", icon: MessageSquare },
  { label: "Calendrier", href: "/pro/calendrier", icon: CalendarDays },
  { label: "Statistiques", href: "/pro/statistiques", icon: BarChart3 },
];

export default function ProSidebar() {
  const path = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-white lg:flex">
      <div className="flex flex-1 flex-col p-4">
        {/* Carte pro */}
        <div className="rounded-2xl bg-cream p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet to-festif font-display text-base font-semibold text-white">
              S
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-plum">
                Studio Lumière
              </p>
              <p className="text-xs text-slate">Photographe · Paris</p>
            </div>
          </div>
          <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-violet-soft px-2.5 py-1 text-xs font-semibold text-violet">
            <BadgeCheck size={13} />
            Vérifié par Misstice
          </span>
        </div>

        <nav className="mt-4 flex-1 space-y-1">
          {NAV.map((item) => {
            const active =
              item.href === "/pro"
                ? path === "/pro"
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
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span
                    className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                      active ? "bg-white/20 text-white" : "bg-festif text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <a
          href="/prestataires/1"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-plum transition-colors hover:border-violet/40 hover:text-violet"
        >
          <ExternalLink size={15} />
          Voir mon profil public
        </a>
      </div>
    </aside>
  );
}
