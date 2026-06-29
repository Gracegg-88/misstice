"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "On a organisé le mariage à trois familles, à distance, sans se prendre la tête. Tout le monde voyait le budget et les tâches en temps réel. Un vrai soulagement.",
    name: "Aïcha & Mehdi",
    role: "Mariage à Lyon",
  },
  {
    quote:
      "Le baptême de notre fils était parfait. J'ai trouvé le traiteur et le photographe en une soirée, tous les deux notés 5 étoiles. Je recommande à toute la famille.",
    name: "Christelle N.",
    role: "Baptême à Paris",
  },
  {
    quote:
      "En tant que DJ, Misstice m'a apporté des demandes sérieuses chaque semaine. Les devis se gèrent directement, c'est carré et pro.",
    name: "DJ Sankara",
    role: "Prestataire · Lyon",
  },
];

export default function Testimonials() {
  const [i, setI] = useState(0);
  const t = testimonials[i];
  const go = (dir: number) =>
    setI((prev) => (prev + dir + testimonials.length) % testimonials.length);

  return (
    <section className="grain relative overflow-hidden bg-ink py-24 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 60% at 80% 10%, rgba(255,140,66,0.18), transparent 60%)," +
            "radial-gradient(50% 50% at 10% 90%, rgba(108,60,225,0.25), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Quote size={40} className="mx-auto text-festif" />

        <blockquote className="mt-8 font-display text-2xl font-medium leading-snug sm:text-3xl">
          « {t.quote} »
        </blockquote>

        <div className="mt-8">
          <p className="font-semibold">{t.name}</p>
          <p className="text-sm text-white/60">{t.role}</p>
        </div>

        {/* Contrôles */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            aria-label="Témoignage précédent"
            onClick={() => go(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/10"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Aller au témoignage ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? "w-6 bg-festif" : "w-2 bg-white/25"
                }`}
              />
            ))}
          </div>

          <button
            aria-label="Témoignage suivant"
            onClick={() => go(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 transition-colors hover:bg-white/10"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
