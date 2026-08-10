import { Heart, CalendarDays, Users, Gift, Lock, Headphones } from "lucide-react";
import Reveal from "./Reveal";
import CalendlyButton from "./CalendlyButton";

const features = [
  { icon: Gift, title: "100% gratuit", sub: "sans engagement", tint: "bg-violet-soft text-violet" },
  { icon: Lock, title: "Paiement sécurisé", sub: "uniquement aux prestataires", tint: "bg-festif-soft text-festif" },
  { icon: Headphones, title: "Accompagnement", sub: "à chaque étape", tint: "bg-violet-soft text-violet" },
];

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-content px-5 py-6 sm:px-8 sm:py-8">
      <Reveal>
        <div
          className="relative overflow-hidden rounded-[32px] border border-black/5 bg-cream bg-cover bg-center shadow-sm"
          style={{ backgroundImage: "url('/discoball-flatlay.jpg')" }}
        >
          {/* Voile dégradé doré, assorti au velours de la photo — texte foncé
              (plum) car ce ton est trop clair pour du texte cream lisible. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#D9B88C]/90 via-[#D9B88C]/60 to-cream/20"
          />

          <div className="relative max-w-2xl p-6 sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream/90 px-3 py-1 text-xs font-semibold text-violet backdrop-blur-sm">
              <Heart size={13} className="text-festif" />
              Gratuit pour commencer
            </span>

            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.15] tracking-tight text-plum sm:text-3xl">
              Prêt à organiser votre événement{" "}
              <span className="text-festif">sans stress</span> ?
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-plum/80">
              Créez votre événement gratuitement, centralisez vos invités, votre
              budget et vos prestataires, puis profitez pleinement du moment.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="/creer"
                className="ev-cta ev-cta-pulse inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-cream shadow-lg shadow-violet/25"
              >
                <CalendarDays size={17} />
                Créer mon événement
              </a>
              <a
                href="/creer?type=pro"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-plum/20 bg-cream/80 px-6 py-3 text-sm font-semibold text-plum backdrop-blur-sm transition-colors hover:bg-cream"
              >
                <Users size={17} />
                Devenir prestataire
              </a>
            </div>

            <CalendlyButton
              label="Ou réservez un appel pour en discuter"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-plum/70 underline decoration-plum/30 underline-offset-2 hover:text-plum"
            />

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 sm:flex-nowrap">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.tint}`}>
                    <f.icon size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-plum">{f.title}</p>
                    <p className="text-xs text-plum/70">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
