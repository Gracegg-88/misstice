import { Star } from "lucide-react";
import CountUp from "./animations/CountUp";
import Reveal from "./Reveal";

const stats: { value: number; suffix: string; label: string }[] = [
  { value: 500, suffix: "+", label: "événements organisés" },
  { value: 300, suffix: "+", label: "prestataires vérifiés" },
  { value: 98, suffix: "%", label: "de familles satisfaites" },
];

export default function StatsBand() {
  return (
    <section className="relative overflow-hidden bg-ink py-14 sm:py-16">
      {/* Aura décorative, cohérente avec le bandeau d'annonce */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="ev-aurora absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-[100px]" />
      </div>

      <div className="relative mx-auto grid max-w-content grid-cols-1 gap-8 px-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 90} className="text-center sm:text-left">
            <p className="font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              <CountUp value={s.value} suffix={s.suffix} />
            </p>
            <p className="mt-1.5 text-sm text-white/60">{s.label}</p>
          </Reveal>
        ))}

        <Reveal delay={270} className="text-center sm:text-left">
          <p className="flex items-center justify-center gap-1 font-display text-4xl font-semibold tracking-tight text-white sm:justify-start sm:text-5xl">
            4,9
            <span className="text-xl text-white/40">/5</span>
          </p>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-white/60 sm:justify-start">
            <span className="inline-flex gap-0.5 text-festif">
              {[0, 1, 2, 3, 4].map((n) => (
                <Star key={n} size={13} className="fill-festif text-festif" />
              ))}
            </span>
            note moyenne des familles
          </p>
        </Reveal>
      </div>
    </section>
  );
}
