"use client";

import { CheckCircle2 } from "lucide-react";
import { useStaggerReveal } from "./useStaggerReveal";

export type ChecklistPeriod = { periode: string; items: string[] };

export default function GuideChecklist({
  periods,
}: {
  periods: ChecklistPeriod[];
}) {
  const { ref, visible, delayFor } = useStaggerReveal<HTMLDivElement>(60);

  // Index continu à travers toutes les périodes : la cascade suit l'ordre
  // chronologique du haut vers le bas, pas une réinitialisation par période.
  let itemIndex = -1;

  return (
    <div ref={ref} className="space-y-5">
      {periods.map((p) => (
        <div
          key={p.periode}
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
        >
          <p className="font-display text-base font-semibold text-violet">
            {p.periode}
          </p>
          <ul className="mt-2.5 space-y-2">
            {p.items.map((item, i) => {
              itemIndex += 1;
              return (
                <li
                  key={i}
                  className={`reveal-item flex gap-2.5 text-sm leading-relaxed text-slate ${visible ? "is-visible" : ""}`}
                  style={delayFor(itemIndex)}
                >
                  <CheckCircle2
                    size={17}
                    className="mt-0.5 shrink-0 text-emerald"
                  />
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
