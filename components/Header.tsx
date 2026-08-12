"use client";

/**
 * Carnet de Confiance — navigation compacte reliant toutes les entrées publiques structurantes de Misstice.
 * Les règles d’authentification et les destinations compte/création existantes sont conservées.
 */
import { useEffect, useState } from "react";
import { Menu, X, CircleUserRound } from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Prestataires", href: "/prestataires" },
  { label: "Guides", href: "/comment-ca-marche" },
  { label: "Confiance", href: "/confiance" },
  { label: "FAQ", href: "/#faq" },
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
      <header className="sticky top-0 z-50 bg-cream/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-16 max-w-content items-center justify-between gap-3 px-4 py-2 sm:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
            {navLinks.map((link) => <a key={link.href} href={link.href} className="font-label text-[10px] font-medium uppercase tracking-[0.11em] text-plum/75 transition-colors hover:text-violet">{link.label}</a>)}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {!account && <a href="/devenir-prestataire" className="font-label text-[10px] font-medium uppercase tracking-[0.08em] text-violet underline decoration-festif decoration-2 underline-offset-4 transition-colors hover:text-violet-dark">Devenir prestataire</a>}
            <a href={account ? account.href : "/auth"} aria-label={account ? "Mon compte" : "Connexion"} title={account ? "Mon compte" : "Connexion"} className="flex h-10 w-10 items-center justify-center text-plum transition-colors hover:text-violet"><CircleUserRound size={19} /></a>
            <a href={account ? account.createHref : "/creer"} className="inline-flex items-center rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">Créer mon événement</a>
          </div>
          <button type="button" aria-label={open ? "Fermer le menu" : "Ouvrir le menu"} onClick={() => setOpen((v) => !v)} className="flex h-10 w-10 items-center justify-center text-plum md:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-start justify-end p-3 md:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex w-full max-w-sm flex-col bg-cream p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between"><Logo /><button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center bg-white text-plum"><X size={18} /></button></div>
            <nav className="flex flex-col py-2">
              {navLinks.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="px-2 py-3 font-label text-xs uppercase tracking-[0.1em] text-plum hover:text-violet">{link.label}</a>)}
            </nav>
            <div className="mt-4 flex flex-col gap-2">
              {!account && <a href="/devenir-prestataire" onClick={() => setOpen(false)} className="bg-violet-soft px-4 py-3 text-center font-label text-xs uppercase tracking-[0.1em] text-violet">Devenir prestataire</a>}
              <a href={account ? account.href : "/auth"} onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 bg-white/60 px-4 py-3 text-center text-sm font-semibold text-plum"><CircleUserRound size={17} />{account ? "Mon compte" : "Connexion"}</a>
              <a href={account ? account.createHref : "/creer"} onClick={() => setOpen(false)} className="bg-violet px-4 py-3 text-center text-sm font-semibold text-white">Créer mon événement</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
