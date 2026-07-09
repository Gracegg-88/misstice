"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Store, Users, Tags } from "lucide-react";

const GROUPS = [
  {
    title: "Pilotage",
    items: [{ icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" }],
  },
  {
    title: "Gestion",
    items: [
      { icon: Store, label: "Prestataires", href: "/admin/prestataires" },
      { icon: Users, label: "Utilisateurs", href: "/admin/utilisateurs" },
      // Les événements sont privés (visibles seulement des personnes concernées) :
      // pas de page de détail côté admin, seulement un compteur agrégé.
      { icon: Tags, label: "Catégories", href: "/admin/categories" },
    ],
  },
];

export default function AdminNav() {
  const path = usePathname();

  return (
    <nav className="space-y-2">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-0.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate/70">
            {g.title}
          </p>
          {g.items.map((n) => {
            const active =
              path === n.href ||
              (n.href !== "/admin" && path.startsWith(n.href));
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`mb-0.5 flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-violet-soft text-violet"
                    : "text-slate hover:bg-violet-soft hover:text-violet"
                }`}
              >
                <n.icon size={17} />
                {n.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
