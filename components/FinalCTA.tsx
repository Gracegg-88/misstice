import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-content px-5 py-24 sm:px-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl bg-violet px-8 py-16 text-center text-white sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(40% 60% at 85% 0%, rgba(255,140,66,0.35), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              Prêt à transformer le stress en plaisir&nbsp;?
            </h2>
            <p className="mt-4 text-lg text-white/80">
              Créez votre événement gratuitement. Vous ne payez que les
              prestataires que vous choisissez.
            </p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/creer"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-base font-semibold text-violet transition-transform hover:scale-[1.02]"
              >
                Je planifie un événement
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </a>
              <a
                href="/pro/inscription"
                className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-white/10"
              >
                Devenir prestataire
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
