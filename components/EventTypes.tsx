import {
  Heart,
  Cake,
  Baby,
  GlassWater,
  Gem,
  Gift,
} from "lucide-react";
import Reveal from "./Reveal";

const types = [
  { icon: Heart, label: "Mariage", tint: "bg-violet-soft text-violet" },
  { icon: Cake, label: "Anniversaire", tint: "bg-festif-soft text-festif" },
  { icon: Baby, label: "Baptême", tint: "bg-emerald-soft text-emerald" },
  { icon: GlassWater, label: "Gala & soirée", tint: "bg-violet-soft text-violet" },
  { icon: Gem, label: "Fiançailles", tint: "bg-festif-soft text-festif" },
  { icon: Gift, label: "Baby shower", tint: "bg-emerald-soft text-emerald" },
];

export default function EventTypes() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-festif">
            Pour chaque occasion
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-plum sm:text-5xl">
            Quel moment célébrez-vous&nbsp;?
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {types.map((t, i) => (
            <Reveal key={t.label} delay={i * 80}>
              <a
                href="/creer"
                className="flex h-full flex-col items-center gap-4 rounded-3xl border border-black/5 bg-cream p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet/5"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${t.tint}`}
                >
                  <t.icon size={24} />
                </span>
                <span className="font-medium text-plum">{t.label}</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
