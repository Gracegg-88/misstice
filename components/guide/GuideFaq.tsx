import { ChevronDown } from "lucide-react";

export type FaqItem = { q: string; a: string };

export default function GuideFaq({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((f) => (
        <details
          key={f.q}
          className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm [&_svg]:open:rotate-180"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-plum marker:hidden">
            {f.q}
            <ChevronDown
              size={20}
              className="shrink-0 text-violet transition-transform"
            />
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-slate">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
