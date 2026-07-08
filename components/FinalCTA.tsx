import { Heart, CalendarDays, Users, Gift, Lock, Headphones } from "lucide-react";
import Reveal from "./Reveal";

const features = [
  { icon: Gift, title: "100% gratuit", sub: "sans engagement", tint: "bg-violet-soft text-violet" },
  { icon: Lock, title: "Paiement sécurisé", sub: "uniquement aux prestataires", tint: "bg-festif-soft text-festif" },
  { icon: Headphones, title: "Accompagnement", sub: "à chaque étape", tint: "bg-violet-soft text-violet" },
];

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-content px-5 py-10 sm:px-8">
      <Reveal>
        <div
          className="relative overflow-hidden rounded-[32px] border border-black/5 bg-cream bg-cover bg-center shadow-sm"
          style={{ backgroundImage: "url('/bacground_session.png')" }}
        >
          {/* Voile clair pour la lisibilité du texte à gauche */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent lg:from-white/60"
          />

          <div className="relative max-w-2xl p-6 sm:p-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-violet backdrop-blur-sm">
              <Heart size={13} className="text-festif" />
              Gratuit pour commencer
            </span>

            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.15] tracking-tight text-plum sm:text-3xl">
              Prêt à organiser votre événement{" "}
              <span className="text-festif">sans stress</span> ?
            </h2>

            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate">
              Créez votre événement gratuitement, centralisez vos invités, votre
              budget et vos prestataires, puis profitez pleinement du moment.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="/creer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:bg-violet-dark hover:shadow-xl"
              >
                <CalendarDays size={17} />
                Créer mon événement
              </a>
              <a
                href="/creer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet/30 bg-white/70 px-6 py-3 text-sm font-semibold text-violet backdrop-blur-sm transition-colors hover:bg-white"
              >
                <Users size={17} />
                Devenir prestataire
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3 sm:flex-nowrap">
              {features.map((f) => (
                <div key={f.title} className="flex items-center gap-2">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${f.tint}`}>
                    <f.icon size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-plum">{f.title}</p>
                    <p className="text-xs text-slate">{f.sub}</p>
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
