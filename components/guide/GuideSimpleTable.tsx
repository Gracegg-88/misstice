"use client";

import { useStaggerReveal } from "./useStaggerReveal";

export type SimpleRow = { poste: string; fourchette: string };

export default function GuideSimpleTable({ rows }: { rows: SimpleRow[] }) {
  const { ref, visible, delayFor } = useStaggerReveal<HTMLDivElement>(70);

  return (
    <div
      ref={ref}
      className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm"
    >
      <table className="w-full min-w-[360px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 bg-violet-soft/50 text-xs uppercase tracking-wide text-plum">
            <th className="px-4 py-3 font-semibold">Poste</th>
            <th className="px-4 py-3 font-semibold">Fourchette</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.poste}
              className={`reveal-row border-b border-black/5 last:border-0 ${visible ? "is-visible" : ""}`}
              style={delayFor(i)}
            >
              <td className="px-4 py-3 font-medium text-plum">{r.poste}</td>
              <td className="px-4 py-3 text-slate">{r.fourchette}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
