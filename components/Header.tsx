"use client";

import { useState } from "react";
import { Menu, X, Sparkles } from "lucide-react";

const navLinks = [
  { label: "Explorer", href: "/prestataires" },
  { label: "Comment ça marche", href: "#comment-ca-marche" },
  { label: "Prestataires", href: "#prestataires" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet text-white">
            <Sparkles size={17} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Misstice
          </span>
        </a>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate transition-colors hover:text-plum"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="/auth"
            className="text-sm font-medium text-plum transition-colors hover:text-violet"
          >
            Connexion
          </a>
          <a
            href="/creer"
            className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-dark hover:shadow-md"
          >
            Créer un événement
          </a>
        </div>

        {/* Burger mobile */}
        <button
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-plum md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="border-t border-black/5 bg-cream px-5 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-plum hover:bg-violet-soft"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-black/5 pt-3">
            <a
              href="/auth"
              className="rounded-xl border border-black/10 px-4 py-2.5 text-center text-sm font-semibold text-plum"
            >
              Connexion
            </a>
            <a
              href="/creer"
              className="rounded-xl bg-violet px-4 py-2.5 text-center text-sm font-semibold text-white"
            >
              Créer un événement
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
