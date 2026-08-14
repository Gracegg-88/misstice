import { Heart, Users } from "lucide-react";
import Reveal from "./Reveal";
import CalendlyButton from "./CalendlyButton";

// Bloc CTA "Devenir prestataire" de la home. Copy volontairement orientée
// communauté / petite échelle plutôt qu'expertise événementielle
// professionnelle — Misstice cible les prestataires qui accompagnent des
// familles, pas des agences.
export default function BecomeVendorCallout({
  headline,
  body,
  signupHref,
  signupLabel = "Devenir prestataire",
  ctaLabel = "Réserver un appel",
}: {
  headline: string;
  body: string;
  signupHref?: string;
  signupLabel?: string;
  ctaLabel?: string;
}) {
  return (
    <section className="mx-auto max-w-content px-5 py-6 sm:px-8">
      <Reveal>
        <div className="bg-violet-soft/35 px-6 py-8 text-center sm:px-10 sm:py-10">
          <span className="mx-auto flex h-11 w-11 items-center justify-center text-violet">
            <Heart size={19} strokeWidth={1.75} />
          </span>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-2xl font-semibold leading-[1.02] tracking-tight text-plum sm:text-3xl">
            {headline}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm font-light leading-relaxed text-slate">
            {body}
          </p>
          <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {signupHref && (
              <a
                href={signupHref}
                className="ev-cta inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-cream shadow-lg shadow-violet/25"
              >
                <Users size={17} />
                {signupLabel}
              </a>
            )}
            <CalendlyButton
              label={ctaLabel}
              className={
                signupHref
                  ? "inline-flex items-center justify-center gap-2 px-3 py-3.5 text-sm font-semibold text-plum underline decoration-festif decoration-2 underline-offset-8 transition-colors hover:text-violet"
                  : "ev-cta inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-cream shadow-lg shadow-violet/25"
              }
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
