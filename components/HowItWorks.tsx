import Link from "next/link";
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
    <section id="comment-ca-marche" className="pt-4 pb-4 sm:pt-6 sm:pb-6">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-violet">
            En 3 étapes
          </p>
          <h2 className="mt-2 text-center font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
            <Link href="/comment-ca-marche" className="transition-colors hover:text-violet">
              Comment ça marche&nbsp;?
            </Link>
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120} className="h-full">
              <div className="group flex h-full items-start gap-4 p-3 transition-all hover:-translate-y-1">
                {/* Icône + pastille numérotée */}
                <div className="relative shrink-0">
                  <span className="flex h-12 w-12 items-center justify-center text-violet">
                    <step.icon size={26} strokeWidth={1.75} />
                  </span>
                  <span className="absolute -left-1 -top-3 font-display text-2xl font-normal italic text-festif">
                    {step.n}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="font-display text-xl font-semibold leading-[1.02] text-plum">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm font-light leading-relaxed text-slate">
                    {step.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate">
          <Link
            href="/comment-ca-marche"
            className="font-semibold text-violet hover:text-violet-dark"
          >
            Voir tous les guides d&apos;organisation par type d&apos;événement
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-slate">
          Tous les prestataires sont vérifiés avant publication :{" "}
          <Link
            href="/confiance"
            className="font-semibold text-violet hover:text-violet-dark"
          >
            découvrez comment nous vérifions chaque profil
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
