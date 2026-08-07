"use client";

import { useState } from "react";
import { X } from "lucide-react";

export type TypeOption = {
  value: string;
  label: string;
  emoji: string;
  tint: string; // classe de fond non sélectionné (ex. "bg-violet-soft")
};

export default function TypeModal({
  title,
  options,
  onSelect,
  onClose,
}: {
  title: string;
  options: TypeOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-plum/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="ev-fade-in relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-xl font-semibold leading-snug tracking-tight text-plum sm:text-2xl">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-cream hover:text-plum"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {options.map((o) => {
            const on = selected === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => setSelected(o.value)}
                aria-pressed={on}
                className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                  on
                    ? "border-violet bg-violet-soft shadow-sm"
                    : `border-transparent ${o.tint} hover:-translate-y-0.5`
                }`}
              >
                <span className="text-3xl" aria-hidden="true">
                  {o.emoji}
                </span>
                <span
                  className={`text-sm font-semibold ${on ? "text-violet" : "text-plum"}`}
                >
                  {o.label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-slate hover:text-plum"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="rounded-2xl bg-violet px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
}
