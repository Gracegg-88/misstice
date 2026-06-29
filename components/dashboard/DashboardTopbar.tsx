"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, LogOut, Settings } from "lucide-react";

export default function DashboardTopbar() {
  const [menu, setMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-cream/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-5 sm:px-8">
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet text-white">
            <Sparkles size={17} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Misstice
          </span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          <a href="/prestataires" className="text-sm font-medium text-slate hover:text-plum">
            Explorer
          </a>
          <a href="/#comment-ca-marche" className="text-sm font-medium text-slate hover:text-plum">
            Comment ça marche
          </a>
          <a href="/dashboard" className="text-sm font-medium text-plum">
            Mes événements
          </a>
        </nav>

        {/* Menu utilisateur */}
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-2 py-1.5 hover:border-black/10"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet text-sm font-semibold text-white">
              G
            </span>
            <span className="hidden text-sm font-medium text-plum sm:block">
              Grace
            </span>
            <ChevronDown size={15} className="text-slate" />
          </button>

          {menu && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-black/5 bg-white p-1.5 shadow-lg">
              <a
                href="#"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-plum hover:bg-cream"
              >
                <Settings size={16} className="text-slate" />
                Paramètres
              </a>
              <a
                href="/auth"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-plum hover:bg-cream"
              >
                <LogOut size={16} className="text-slate" />
                Se déconnecter
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
