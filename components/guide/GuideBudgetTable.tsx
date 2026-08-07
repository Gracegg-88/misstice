"use client";

import { useStaggerReveal } from "./useStaggerReveal";

export type BudgetRow = { poste: string; paris: string; province: string };

export default function GuideBudgetTable({ rows }: { rows: BudgetRow[] }) {
  const { ref, visible, delayFor } = useStaggerReveal<HTMLDivElement>(70);

  return (
    <div
      ref={ref}
      className="overflow-x-auto rounded-2xl border border-black/5 bg-white shadow-sm"
    >
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 bg-violet-soft/50 text-xs uppercase tracking-wide text-plum">
            <th className="px-4 py-3 font-semibold">Poste</th>
            <th className="px-4 py-3 font-semibold">Région parisienne</th>
            <th className="px-4 py-3 font-semibold">Province</th>
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
              <td className="px-4 py-3 text-slate">{r.paris}</td>
              <td className="px-4 py-3 text-slate">{r.province}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
