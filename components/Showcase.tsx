import { Wallet, ListChecks, UsersRound, Armchair, MessageCircle, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Reveal from "./Reveal";

const features: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Wallet, title: "Budget maîtrisé", text: "Suivez chaque dépense en temps réel, sans mauvaise surprise." },
  { icon: ListChecks, title: "Checklist claire", text: "Une liste de tâches pensée pour ne rien oublier, à votre rythme." },
  { icon: UsersRound, title: "Invités & RSVP", text: "Envoyez vos invitations et suivez les réponses en un coup d'œil." },
  { icon: Armchair, title: "Plan de table", text: "Organisez vos tables par glisser-déposer, sans prise de tête." },
  { icon: MessageCircle, title: "Équipe & messagerie", text: "Répartissez les tâches et échangez avec vos proches en direct." },
  { icon: ShieldCheck, title: "Prestataires vérifiés", text: "Comparez des devis fiables, sans quitter la plateforme." },
];

export default function Showcase() {
  return (
    <section className="relative overflow-hidden bg-ink py-16 sm:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-violet/25 blur-[120px]" />
        <div className="absolute -right-24 top-0 h-72 w-72 rounded-full bg-festif/15 blur-[110px]" />
      </div>

      <div className="relative mx-auto grid max-w-content gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:gap-16">
        {/* Colonne visuel */}
        <Reveal className="order-2 lg:order-1">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/decoration.png"
              alt="Une table décorée pour un mariage organisé avec Misstice"
              className="w-full rounded-[28px] border border-white/10 object-cover shadow-2xl shadow-black/30"
            />
            <div className="absolute -bottom-5 -right-4 hidden items-center gap-2.5 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-xl sm:flex">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                <Wallet size={18} />
              </span>
              <div>
                <p className="text-xs font-semibold text-plum">Budget suivi</p>
                <p className="text-[11px] text-slate">12 450 € / 15 000 €</p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Colonne texte + fonctionnalités */}
        <div className="order-1 lg:order-2">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB27A]">
              Tout centralisé
            </p>
            <h2 className="mt-2 max-w-md font-display text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
              Une seule plateforme pour organiser l&apos;événement de vos rêves
            </h2>
          </Reveal>

          <div className="mt-9 grid gap-6 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 70}>
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <f.icon size={18} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{f.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{f.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
