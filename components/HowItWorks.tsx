import { CalendarPlus, Users, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Reveal from "./Reveal";

const steps: {
  n: number;
  icon: LucideIcon;
  title: string;
  text: string;
}[] = [
  {
    n: 1,
    icon: CalendarPlus,
    title: "Créez votre événement",
    text: "Indiquez les informations essentielles et donnez vie à votre projet en quelques minutes.",
  },
  {
    n: 2,
    icon: Users,
    title: "Organisez budget, invités et tâches",
    text: "Gérez votre budget, suivez votre checklist et centralisez toutes les informations.",
  },
  {
    n: 3,
    icon: Store,
    title: "Réservez vos prestataires",
    text: "Trouvez les meilleurs prestataires, comparez et réservez en toute sérénité.",
  },
];

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="pt-6 pb-6 sm:pt-8 sm:pb-8">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
            En 3 étapes
          </p>
          <h2 className="mt-2 text-center font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
            Comment ça marche&nbsp;?
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120} className="h-full">
              <div className="group flex h-full items-start gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-violet/20 hover:shadow-xl hover:shadow-violet/5">
                {/* Icône + pastille numérotée */}
                <div className="relative shrink-0">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                    <step.icon size={26} strokeWidth={1.75} />
                  </span>
                  <span className="absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-violet font-display text-sm font-bold text-white shadow-md shadow-violet/30">
                    {step.n}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold leading-snug text-plum">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">
                    {step.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
