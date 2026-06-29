import { CalendarHeart, Users, PartyPopper } from "lucide-react";
import Reveal from "./Reveal";

const steps = [
  {
    icon: CalendarHeart,
    title: "Créez votre événement",
    text: "Type, date, budget, nombre d'invités. En 2 minutes, votre espace est prêt et tout est centralisé.",
  },
  {
    icon: Users,
    title: "Invitez vos proches & trouvez vos prestataires",
    text: "Partagez les tâches en famille — « Tonton gère le DJ » — et contactez des prestataires vérifiés.",
  },
  {
    icon: PartyPopper,
    title: "Profitez du jour J",
    text: "Budget maîtrisé, checklist au vert, invités confirmés. Le reste, c'est juste la fête.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="comment-ca-marche"
      className="mx-auto max-w-content px-5 py-24 sm:px-8"
    >
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-festif">
          Comment ça marche
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-plum sm:text-5xl">
          Trois étapes, zéro casse-tête
        </h2>
      </Reveal>

      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {steps.map((step, i) => (
          <Reveal key={step.title} delay={i * 120}>
            <div className="group h-full rounded-3xl border border-black/5 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet/5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-soft text-violet transition-colors group-hover:bg-violet group-hover:text-white">
                <step.icon size={26} />
              </div>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-display text-sm font-semibold text-festif">
                  0{i + 1}
                </span>
                <h3 className="font-display text-xl font-semibold text-plum">
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 leading-relaxed text-slate">{step.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
