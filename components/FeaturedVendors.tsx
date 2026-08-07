import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Reveal from "./Reveal";
import FeaturedVendorsGrid from "./FeaturedVendorsGrid";
import { getVendors } from "@/lib/vendors";

export default async function FeaturedVendors() {
  // Vraies fiches (annuaire réel), 6 premières. Tant qu'il n'y en a aucune
  // (fiches de démonstration retirées, voir supabase/remove-demo-vendors.sql),
  // on affiche un bloc d'annonce plutôt que la grille — jamais de faux
  // prestataires sur le site.
  const vendors = (await getVendors()).slice(0, 6);

  if (vendors.length === 0) {
    return (
      <section
        id="prestataires"
        className="mx-auto max-w-content px-4 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8"
      >
        <Reveal>
          <div className="rounded-[32px] bg-gradient-soft px-6 py-14 text-center sm:px-12 sm:py-16">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet text-cream shadow-lg shadow-violet/25">
              <Sparkles size={26} strokeWidth={1.75} />
            </span>
            <h2 className="mx-auto mt-5 max-w-md font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
              Les premiers prestataires arrivent bientôt
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
              Nous sélectionnons et vérifions actuellement les premiers
              profils. Traiteur, photographe, DJ, décorateur, fleuriste…
              rejoignez l&apos;aventure dès maintenant.
            </p>
            <Link
              href="/devenir-prestataire"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-primary px-7 py-3.5 text-sm font-semibold text-cream shadow-lg shadow-violet/25 transition-all hover:brightness-110"
            >
              Devenir prestataire
              <ArrowRight size={16} />
            </Link>
          </div>
        </Reveal>
      </section>
    );
  }

  return (
    <section
      id="prestataires"
      className="mx-auto max-w-content px-4 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8"
    >
      <Reveal className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
          Prestataires disponibles
        </h2>
        <a
          href="/prestataires"
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-violet hover:text-violet-dark"
        >
          Voir tous les prestataires
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </Reveal>

      <FeaturedVendorsGrid vendors={vendors} />
    </section>
  );
}
