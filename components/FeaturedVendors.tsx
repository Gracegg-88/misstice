import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import FeaturedVendorsGrid from "./FeaturedVendorsGrid";
import { getVendors } from "@/lib/vendors";

export default async function FeaturedVendors() {
  // Vraies fiches (annuaire réel), 6 premières.
  const vendors = (await getVendors()).slice(0, 6);
  if (vendors.length === 0) return null;

  return (
    <section id="prestataires" className="mx-auto max-w-content px-4 pb-16 pt-6 sm:px-8 sm:pb-20 sm:pt-8">
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
