"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const reviews = [
  {
    quote:
      "On a organisé le mariage à trois familles, à distance, sans se prendre la tête. Tout le monde voyait le budget et les tâches en temps réel. Un vrai soulagement.",
    name: "Aïcha & Mehdi",
    role: "Mariage à Lyon",
    img: "/avis-1.png",
  },
  {
    quote:
      "Le baptême de notre fils était parfait. J'ai trouvé le traiteur et le photographe en une soirée, tous les deux notés 5 étoiles. Je recommande à toute la famille.",
    name: "Christelle N.",
    role: "Baptême à Paris",
    img: "/avis-2.png",
  },
  {
    quote:
      "En tant que DJ, Misstice m'a apporté des demandes sérieuses chaque semaine. Les devis se gèrent directement, c'est carré et pro.",
    name: "DJ Sankara",
    role: "Prestataire · Lyon",
    img: "/avis-3.png",
  },
];

export default function ReviewsCard() {
  const [i, setI] = useState(0);
  const t = reviews[i];
  const go = (dir: number) =>
    setI((prev) => (prev + dir + reviews.length) % reviews.length);

  return (
    <div className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-display text-xl font-semibold leading-snug text-plum sm:text-2xl">
          Déjà adoptée par des familles partout en France
        </h3>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Avis précédent"
            onClick={() => go(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-plum transition-colors hover:bg-cream"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label="Avis suivant"
            onClick={() => go(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-plum transition-colors hover:bg-cream"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Étoiles */}
      <div className="mt-4 flex gap-1">
        {[0, 1, 2, 3, 4].map((s) => (
          <Star key={s} size={18} className="fill-festif text-festif" />
        ))}
      </div>

      <blockquote className="mt-4 flex-1 text-lg leading-relaxed text-slate">
        «&nbsp;{t.quote}&nbsp;»
      </blockquote>

      {/* Auteur */}
      <div className="mt-6 flex items-center gap-3 border-t border-black/5 pt-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.img}
          alt={t.name}
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
        <div>
          <p className="font-semibold text-plum">{t.name}</p>
          <p className="text-sm text-slate">{t.role}</p>
        </div>
      </div>

      {/* Puces */}
      <div className="mt-5 flex gap-2">
        {reviews.map((_, idx) => (
          <button
            key={idx}
            type="button"
            aria-label={`Aller à l'avis ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-2 rounded-full transition-all ${
              idx === i ? "w-6 bg-violet" : "w-2 bg-black/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
