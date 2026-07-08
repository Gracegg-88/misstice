"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function CategorySelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
      >
        <span className={value ? "text-plum" : "text-slate"}>
          {value || "Choisir une catégorie…"}
        </span>
        <ChevronDown size={16} className="shrink-0 text-slate" />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-black/10 bg-white p-1.5 shadow-lg">
          <div className="relative mb-1">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="w-full rounded-lg border border-black/10 bg-cream py-1.5 pl-8 pr-2 text-sm text-plum outline-none focus:border-violet"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  onChange(o);
                  setOpen(false);
                  setQuery("");
                }}
                className={`block w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-cream ${
                  o === value ? "bg-violet-soft text-violet" : "text-plum"
                }`}
              >
                {o}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate">
                Aucune catégorie trouvée.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
