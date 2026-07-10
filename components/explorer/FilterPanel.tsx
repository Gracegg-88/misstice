"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, ChevronDown, Search, Check, X, Sparkles } from "lucide-react";
import {
  MOODS,
  ENERGIES,
  LIGHTS,
  PALETTES,
  ATMOSPHERES,
  MUSIC_STYLES,
  countVibes,
  type VibeSelection,
} from "@/lib/vibes";

export type Filters = {
  categories: string[];
  city: string;
  priceLevels: number[];
  minRating: number;
  vibes: VibeSelection;
};

// Groupe de puces sélectionnables (un axe de vibe).
function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              aria-pressed={on}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                on
                  ? "bg-violet text-white"
                  : "bg-cream text-slate hover:text-plum"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Combobox multi-sélection avec recherche (même style que le sélecteur pro). */
function CategoryMultiSelect({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (c: string) => void;
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

  const label =
    selected.length === 0
      ? "Toutes les catégories"
      : `${selected.length} sélectionnée${selected.length > 1 ? "s" : ""}`;

  return (
    <div ref={ref} className="relative mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
      >
        <span className={selected.length ? "text-plum" : "text-slate"}>
          {label}
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
              placeholder="Rechercher une catégorie…"
              className="w-full rounded-lg border border-black/10 bg-cream py-1.5 pl-8 pr-2 text-sm text-plum outline-none focus:border-violet"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((o) => {
              const on = selected.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => onToggle(o)}
                  aria-pressed={on}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-sm transition-colors hover:bg-cream ${
                    on ? "bg-violet-soft text-violet" : "text-plum"
                  }`}
                >
                  {o}
                  {on && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-sm text-slate">
                Aucune catégorie trouvée.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Catégories sélectionnées → puces retirables */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onToggle(c)}
              className="inline-flex items-center gap-1 rounded-full bg-violet px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-dark"
            >
              {c}
              <X size={12} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({
  filters,
  setFilters,
  categories,
  cities,
  onReset,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  categories: string[];
  cities: string[];
  onReset: () => void;
}) {
  const [vibesOpen, setVibesOpen] = useState(false);
  const toggleIn = (arr: number[], v: number) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  const toggleCat = (c: string) =>
    setFilters({
      ...filters,
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });

  // Ajoute / retire un tag « vibe » sur un axe donné.
  const toggleVibe = (axis: keyof VibeSelection, value: string) =>
    setFilters({
      ...filters,
      vibes: {
        ...filters.vibes,
        [axis]: filters.vibes[axis].includes(value)
          ? filters.vibes[axis].filter((x) => x !== value)
          : [...filters.vibes[axis], value],
      },
    });
  const vibeCount = countVibes(filters.vibes);

  const labelCls = "text-sm font-semibold text-plum";
  const sectionCls = "border-t border-black/5 pt-5 mt-5 first:mt-0 first:border-0 first:pt-0";

  return (
    <div>
      {/* Catégorie */}
      <div className={sectionCls}>
        <p className={labelCls}>Catégorie</p>
        <CategoryMultiSelect
          options={categories}
          selected={filters.categories}
          onToggle={toggleCat}
        />
      </div>

      {/* Localisation */}
      <div className={sectionCls}>
        <p className={labelCls}>Localisation</p>
        <select
          value={filters.city}
          onChange={(e) => setFilters({ ...filters, city: e.target.value })}
          className="mt-3 w-full rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm text-plum outline-none focus:border-violet"
        >
          <option value="all">Toutes les villes</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Budget */}
      <div className={sectionCls}>
        <p className={labelCls}>Budget</p>
        <div className="mt-3 flex gap-2">
          {[1, 2, 3].map((lvl) => {
            const on = filters.priceLevels.includes(lvl);
            return (
              <button
                key={lvl}
                onClick={() =>
                  setFilters({
                    ...filters,
                    priceLevels: toggleIn(filters.priceLevels, lvl),
                  })
                }
                aria-pressed={on}
                className={`flex-1 rounded-xl border py-2 text-sm font-semibold transition-colors ${
                  on
                    ? "border-violet bg-violet-soft text-violet"
                    : "border-black/10 text-slate hover:border-violet/40"
                }`}
              >
                {"€".repeat(lvl)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note minimale */}
      <div className={sectionCls}>
        <p className={labelCls}>Note minimale</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { v: 0, l: "Toutes" },
            { v: 4, l: "4★ et +" },
            { v: 4.5, l: "4,5★ et +" },
            { v: 4.8, l: "4,8★ et +" },
          ].map((o) => {
            const on = filters.minRating === o.v;
            return (
              <button
                key={o.v}
                onClick={() => setFilters({ ...filters, minRating: o.v })}
                aria-pressed={on}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  on
                    ? "bg-violet text-white"
                    : "bg-cream text-plum hover:bg-violet-soft"
                }`}
              >
                {o.l}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ambiance & Vibe */}
      <div className={sectionCls}>
        <button
          type="button"
          onClick={() => setVibesOpen((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={15} className="text-violet" />
            <span className={labelCls}>Ambiance &amp; Vibe</span>
            {vibeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-[11px] font-semibold text-white">
                {vibeCount}
              </span>
            )}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-slate transition-transform ${vibesOpen ? "rotate-180" : ""}`}
          />
        </button>

        {vibesOpen && (
          <div className="mt-1">
            <ChipGroup
              label="Mood / Ambiance"
              options={MOODS}
              selected={filters.vibes.moods}
              onToggle={(v) => toggleVibe("moods", v)}
            />
            <ChipGroup
              label="Énergie du prestataire"
              options={ENERGIES}
              selected={filters.vibes.energies}
              onToggle={(v) => toggleVibe("energies", v)}
            />
            <ChipGroup
              label="Lumière"
              options={LIGHTS}
              selected={filters.vibes.lights}
              onToggle={(v) => toggleVibe("lights", v)}
            />
            <ChipGroup
              label="Palette"
              options={PALETTES}
              selected={filters.vibes.palettes}
              onToggle={(v) => toggleVibe("palettes", v)}
            />
            <ChipGroup
              label="Atmosphère"
              options={ATMOSPHERES}
              selected={filters.vibes.atmospheres}
              onToggle={(v) => toggleVibe("atmospheres", v)}
            />
            <ChipGroup
              label="Style musical (DJ / animateur)"
              options={MUSIC_STYLES}
              selected={filters.vibes.music}
              onToggle={(v) => toggleVibe("music", v)}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-slate transition-colors hover:border-plum/30 hover:text-plum"
      >
        <RotateCcw size={15} />
        Réinitialiser les filtres
      </button>
    </div>
  );
}
