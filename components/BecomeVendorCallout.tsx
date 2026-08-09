import { Heart } from "lucide-react";
import Reveal from "./Reveal";
import CalendlyButton from "./CalendlyButton";

// Bloc CTA "Devenir prestataire" répété à plusieurs endroits de la home.
// Copy volontairement orientée communauté / petite échelle plutôt
// qu'expertise événementielle professionnelle — Misstice cible les
// prestataires qui accompagnent des familles, pas des agences.
export default function BecomeVendorCallout({
  headline,
  body,
  ctaLabel = "Réserver un appel",
}: {
  headline: string;
  body: string;
  ctaLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-content px-5 py-6 sm:px-8">
      <Reveal>
        <div className="rounded-[28px] border border-violet/15 bg-violet-soft/40 px-6 py-8 text-center sm:px-10 sm:py-10">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-violet text-cream shadow-md shadow-violet/25">
            <Heart size={19} strokeWidth={1.75} />
          </span>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-xl font-semibold leading-snug tracking-tight text-plum sm:text-2xl">
            {headline}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate">
            {body}
          </p>
          <CalendlyButton
            label={ctaLabel}
            className="ev-cta mt-5 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-cream shadow-lg shadow-violet/25"
          />
        </div>
      </Reveal>
    </section>
  );
}
