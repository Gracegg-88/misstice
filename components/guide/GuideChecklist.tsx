import { CheckCircle2 } from "lucide-react";

export type ChecklistPeriod = { periode: string; items: string[] };

export default function GuideChecklist({
  periods,
}: {
  periods: ChecklistPeriod[];
}) {
  return (
    <div className="space-y-5">
      {periods.map((p) => (
        <div
          key={p.periode}
          className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
        >
          <p className="font-display text-base font-semibold text-violet">
            {p.periode}
          </p>
          <ul className="mt-2.5 space-y-2">
            {p.items.map((item, i) => (
              <li
                key={i}
                className="flex gap-2.5 text-sm leading-relaxed text-slate"
              >
                <CheckCircle2
                  size={17}
                  className="mt-0.5 shrink-0 text-emerald"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
