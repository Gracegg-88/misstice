"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Accueil", href: "/" },
  { label: "Comment ça marche", href: "/#comment-ca-marche" },
  { label: "FAQ", href: "/#faq" },
  { label: "Prestataires", href: "/prestataires" },
];

type Account = { href: string; createHref: string };

export default function Header() {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);

  // Détecte l'utilisateur connecté pour adapter les boutons.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = data?.role;
      const href =
        role === "admin" ? "/admin" : role === "prestataire" ? "/pro" : "/dashboard";
      const createHref = role === "particulier" ? "/dashboard/nouveau" : href;
      setAccount({ href, createHref });
    });
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-cream/70 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 max-w-content items-center justify-between gap-3 px-4 py-2 sm:px-8">
        <Logo />

        {/* Nav desktop */}
        <nav className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-plum/80 transition-colors hover:text-violet"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className="hidden items-center gap-3 md:flex">
          {!account && (
            <a
              href="/creer?type=pro"
              className="text-sm font-semibold text-plum/80 transition-colors hover:text-violet"
            >
              Je suis prestataire
            </a>
          )}
          <a
            href={account ? account.href : "/auth"}
            className="rounded-xl border border-plum/15 bg-white/70 px-5 py-2.5 text-sm font-semibold text-plum transition-colors hover:border-plum/30"
          >
            {account ? "Mon compte" : "Connexion"}
          </a>
          <a
            href={account ? account.createHref : "/creer"}
            className="inline-flex items-center rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet/20 transition-all hover:bg-violet-dark hover:shadow-md lg:px-5"
          >
            Créer mon événement
          </a>
        </div>

        {/* Burger mobile */}
        <button
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          onClick={() => setOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-plum md:hidden"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      </header>

      {/* Menu mobile en modale */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:hidden">
          <div
            className="absolute inset-0 bg-plum/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex max-h-[85vh] w-full max-w-sm flex-col overflow-y-auto rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-plum"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-base font-medium text-plum hover:bg-violet-soft hover:text-violet"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-black/5 pt-3">
              {!account && (
                <a
                  href="/creer?type=pro"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-violet/30 bg-violet-soft px-4 py-2.5 text-center text-sm font-semibold text-violet"
                >
                  Je suis prestataire
                </a>
              )}
              <a
                href={account ? account.href : "/auth"}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-black/10 px-4 py-2.5 text-center text-sm font-semibold text-plum"
              >
                {account ? "Mon compte" : "Connexion"}
              </a>
              <a
                href={account ? account.createHref : "/creer"}
                onClick={() => setOpen(false)}
                className="rounded-xl bg-violet px-4 py-2.5 text-center text-sm font-semibold text-white"
              >
                Créer mon événement
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
