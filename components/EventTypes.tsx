import { Gem, Cake, Church, Sparkles, Baby } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Reveal from "./Reveal";

const types: {
  icon: LucideIcon;
  label: string;
  text: string;
}[] = [
  { icon: Gem, label: "Mariage", text: "Gérez chaque détail de votre grand jour" },
  { icon: Cake, label: "Anniversaire", text: "Planifiez en toute sérénité" },
  { icon: Church, label: "Baptême", text: "Organisez chaque instant avec soin" },
  { icon: Sparkles, label: "Gala", text: "Un événement professionnel et mémorable" },
  { icon: Baby, label: "Baby Shower", text: "Préparez l'arrivée de bébé sereinement" },
];

export default function EventTypes() {
  return (
    <section id="fonctionnalites" className="pt-14 pb-6 sm:pt-16 sm:pb-8">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
            Types d&apos;événements
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-plum sm:text-2xl">
            Pour tous vos moments importants
          </h2>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {types.map((t, i) => (
            <Reveal key={t.label} delay={i * 70}>
              <a
                href="/creer"
                className="flex h-full items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet/20 hover:shadow-lg hover:shadow-violet/5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                  <t.icon size={22} strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-plum">{t.label}</span>
                  <span className="block text-sm leading-snug text-slate">
                    {t.text}
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
