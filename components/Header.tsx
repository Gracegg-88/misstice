"use client";

/**
 * Nouveau style du site (Complément 2, inspiration y-vision.co.kr) : barre de
 * navigation "pilule" flottante, centrée, qui reste visible au défilement.
 * Ordinateur : le menu complet est affiché dans la pilule. Mobile : les 3
 * traits ouvrent un panneau plein écran (qui contient aussi "Devenir
 * prestataire").
 */
import { useEffect, useState } from "react";
import { Menu, X, CircleUserRound } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Prestataires", href: "/prestataires" },
  { label: "Guides", href: "/comment-ca-marche" },
  { label: "Confiance", href: "/confiance" },
  { label: "FAQ", href: "/faq" },
];

type Account = { href: string; createHref: string };

export default function Header({ initialAccount = null }: { initialAccount?: Account | null }) {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<Account | null>(initialAccount);

  useEffect(() => {
    if (initialAccount) return;
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const role = data?.role;
      const href = role === "admin" ? "/admin" : role === "prestataire" ? "/pro" : "/dashboard";
      const createHref = role === "particulier" ? "/dashboard/nouveau" : href;
      setAccount({ href, createHref });
    });
  }, [initialAccount]);

  return (
    <>
      <header className="sticky top-3 z-50 px-page sm:top-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 rounded-full bg-white/95 py-2 pl-2.5 pr-2 shadow-lg shadow-ink/10 ring-1 ring-black/5 backdrop-blur-md sm:gap-3 sm:pl-3 sm:pr-2.5 lg:max-w-4xl lg:pl-5">
          {/* Mobile : 3 traits → panneau plein écran. */}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex min-h-11 items-center gap-1.5 rounded-full px-2.5 text-sm font-semibold text-plum transition-colors hover:bg-plum/5 sm:px-3.5 lg:hidden"
          >
            <Menu size={18} />
            <span className="hidden sm:inline">Menu</span>
          </button>

          {/* Ordinateur : menu complet affiché directement dans la pilule. */}
          <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigation principale">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-plum/80 transition-colors hover:text-violet"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a href="/" className="lg:hidden" aria-label="Misstice — accueil">
            <Logo />
          </a>
          <a href="/" className="hidden lg:block" aria-label="Misstice — accueil">
            <Logo />
          </a>

          <div className="hidden items-center gap-5 lg:flex">
            {!account && (
              <a
                href="/devenir-prestataire"
                className="text-sm font-medium text-plum/80 transition-colors hover:text-violet"
              >
                Devenir prestataire
              </a>
            )}
            <a
              href={account ? account.href : "/auth"}
              aria-label={account ? "Mon compte" : "Connexion"}
              title={account ? "Mon compte" : "Connexion"}
              className="flex h-9 w-9 items-center justify-center text-plum transition-colors hover:text-violet"
            >
              <CircleUserRound size={19} />
            </a>
            <a
              href={account ? account.createHref : "/creer"}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 text-sm font-semibold text-cream transition-transform hover:-translate-y-0.5"
            >
              Créer mon événement
            </a>
          </div>

          <a
            href={account ? account.createHref : "/creer"}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-3.5 text-sm font-semibold text-cream transition-transform hover:-translate-y-0.5 sm:px-5 lg:hidden"
          >
            <span className="sm:hidden">Créer</span>
            <span className="hidden sm:inline">Créer mon événement</span>
          </a>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-6 lg:hidden">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="ev-fade-in relative flex w-full max-w-lg flex-col rounded-3xl bg-cream p-6 shadow-2xl sm:p-8">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                aria-label="Fermer le menu"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-plum"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mt-6 flex flex-col" aria-label="Navigation principale">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-black/5 py-4 font-display text-xl font-medium text-plum transition-colors hover:text-violet"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="mt-5 flex flex-col gap-2.5">
              {!account && (
                <a
                  href="/devenir-prestataire"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-violet-soft px-4 py-3.5 text-center text-sm font-semibold text-violet"
                >
                  Devenir prestataire
                </a>
              )}
              <a
                href={account ? account.href : "/auth"}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-4 py-3.5 text-center text-sm font-semibold text-plum"
              >
                <CircleUserRound size={17} />
                {account ? "Mon compte" : "Connexion"}
              </a>
              <a
                href={account ? account.createHref : "/creer"}
                onClick={() => setOpen(false)}
                className="rounded-full bg-ink px-4 py-3.5 text-center text-sm font-semibold text-cream"
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
