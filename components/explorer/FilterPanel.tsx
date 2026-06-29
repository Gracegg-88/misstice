"use client";

import { BadgeCheck, Zap, RotateCcw } from "lucide-react";
import { CATEGORIES, LANGUAGES } from "./vendors";

export type Filters = {
  categories: string[];
  city: string;
  priceLevels: number[];
  minRating: number;
  verifiedOnly: boolean;
  fastReplyOnly: boolean;
  language: string;
};

export default function FilterPanel({
  filters,
  setFilters,
  cities,
  onReset,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  cities: string[];
  onReset: () => void;
}) {
  const toggleIn = (arr: number[], v: number) =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  const toggleCat = (c: string) =>
    setFilters({
      ...filters,
      categories: filters.categories.includes(c)
        ? filters.categories.filter((x) => x !== c)
        : [...filters.categories, c],
    });

  const labelCls = "text-sm font-semibold text-plum";
  const sectionCls = "border-t border-black/5 pt-5 mt-5 first:mt-0 first:border-0 first:pt-0";

  return (
    <div>
      {/* Catégorie */}
      <div className={sectionCls}>
        <p className={labelCls}>Catégorie</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const on = filters.categories.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCat(c)}
                aria-pressed={on}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  on
                    ? "bg-violet text-white"
                    : "bg-cream text-plum hover:bg-violet-soft"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
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

      {/* Langues */}
      <div className={sectionCls}>
        <p className={labelCls}>Langue parlée</p>
        <select
          value={filters.language}
          onChange={(e) =>
            setFilters({ ...filters, language: e.target.value })
          }
          className="mt-3 w-full rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm text-plum outline-none focus:border-violet"
        >
          <option value="all">Toutes les langues</option>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Bascules de confiance */}
      <div className={sectionCls}>
        <label className="flex cursor-pointer items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-plum">
            <BadgeCheck size={18} className="text-violet" />
            Vérifiés uniquement
          </span>
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={(e) =>
              setFilters({ ...filters, verifiedOnly: e.target.checked })
            }
            className="h-5 w-5 accent-violet"
          />
        </label>
        <label className="mt-4 flex cursor-pointer items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium text-plum">
            <Zap size={18} className="text-festif" />
            Répond vite (≤ 3h)
          </span>
          <input
            type="checkbox"
            checked={filters.fastReplyOnly}
            onChange={(e) =>
              setFilters({ ...filters, fastReplyOnly: e.target.checked })
            }
            className="h-5 w-5 accent-violet"
          />
        </label>
      </div>

      <button
        onClick={onReset}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-slate transition-colors hover:border-plum/30 hover:text-plum"
      >
        <RotateCcw size={15} />
        Réinitialiser les filtres
      </button>
    </div>
  );
}
