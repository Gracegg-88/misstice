"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  SlidersHorizontal,
  X,
  Heart,
  ShieldCheck,
  Eye,
  Scale,
  MailX,
  LayoutGrid,
  Map as MapIcon,
} from "lucide-react";
import { VENDORS } from "./vendors";
import VendorCard from "./VendorCard";
import FilterPanel, { type Filters } from "./FilterPanel";

// La carte ne se charge que côté client (Leaflet a besoin du navigateur).
const VendorsMap = dynamic(() => import("./VendorsMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] items-center justify-center rounded-3xl border border-black/5 bg-white text-sm text-slate">
      Chargement de la carte…
    </div>
  ),
});

const DEFAULT_FILTERS: Filters = {
  categories: [],
  city: "all",
  priceLevels: [],
  minRating: 0,
  verifiedOnly: false,
  fastReplyOnly: false,
  language: "all",
};

const SORTS = [
  { v: "merite", l: "Les meilleurs (au mérite)" },
  { v: "note", l: "Les mieux notés" },
  { v: "avis", l: "Le plus d'avis" },
  { v: "prix", l: "Prix croissant" },
  { v: "reponse", l: "Répondent le plus vite" },
];

// Les promesses qui répondent point par point aux reproches du secteur.
const PROMISES = [
  { icon: Scale, title: "Classement au mérite", text: "Jamais d'achat de position. L'ordre dépend des notes et des avis, pas du portefeuille." },
  { icon: Eye, title: "Avis vérifiés, tous publiés", text: "Positifs comme négatifs. Issus de vraies prestations, jamais supprimés contre paiement." },
  { icon: ShieldCheck, title: "Prestataires contrôlés", text: "Le badge « Vérifié » signifie pièces et références réellement vérifiées." },
  { icon: MailX, title: "Zéro spam, zéro faux lead", text: "Vous contactez qui vous voulez. Les pros reçoivent de vraies demandes, pas du bruit." },
];

export default function ExplorerClient() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("merite");
  const [saved, setSaved] = useState<number[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<"liste" | "carte">("liste");

  const cities = useMemo(
    () => Array.from(new Set(VENDORS.map((v) => v.city))).sort(),
    []
  );

  const toggleSave = (id: number) =>
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = VENDORS.filter((v) => {
      if (filters.categories.length && !filters.categories.includes(v.category))
        return false;
      if (filters.city !== "all" && v.city !== filters.city) return false;
      if (filters.priceLevels.length && !filters.priceLevels.includes(v.priceLevel))
        return false;
      if (v.rating < filters.minRating) return false;
      if (filters.verifiedOnly && !v.verified) return false;
      if (filters.fastReplyOnly && v.responseHours > 3) return false;
      if (filters.language !== "all" && !v.languages.includes(filters.language))
        return false;
      if (
        q &&
        ![v.name, v.category, v.city, v.tagline]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "note":
          return b.rating - a.rating;
        case "avis":
          return b.reviews - a.reviews;
        case "prix":
          return a.priceLevel - b.priceLevel;
        case "reponse":
          return a.responseHours - b.responseHours;
        default:
          // mérite : note pondérée par le nombre d'avis (pas de boost payant)
          return b.rating * Math.log10(b.reviews + 1) -
            a.rating * Math.log10(a.reviews + 1);
      }
    });
    return list;
  }, [filters, query, sort]);

  const activeCount =
    filters.categories.length +
    filters.priceLevels.length +
    (filters.city !== "all" ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.language !== "all" ? 1 : 0) +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.fastReplyOnly ? 1 : 0);

  return (
    <div className="mx-auto max-w-content px-5 py-12 sm:px-8">
      {/* En-tête */}
      <div className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight text-plum sm:text-5xl">
          Trouvez le prestataire qui vous ressemble
        </h1>
        <p className="mt-3 text-lg text-slate">
          Photographes, traiteurs, DJ, salles… Comparez en toute transparence et
          gardez vos favoris.
        </p>
      </div>

      {/* Bande de promesses (anti-reproches du secteur) */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PROMISES.map((p) => (
          <div
            key={p.title}
            className="rounded-2xl border border-black/5 bg-white p-4"
          >
            <p.icon size={20} className="text-violet" />
            <p className="mt-2 text-sm font-semibold text-plum">{p.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate">{p.text}</p>
          </div>
        ))}
      </div>

      {/* Barre de recherche + tri + filtres (mobile) */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un prestataire, une ville…"
            className="w-full rounded-2xl border border-black/10 bg-white py-3.5 pl-11 pr-4 text-sm text-plum outline-none placeholder:text-slate focus:border-violet"
          />
        </div>

        <div className="flex gap-3">
          {/* Bascule Liste / Carte */}
          <div className="flex rounded-2xl border border-black/10 bg-white p-1">
            <button
              onClick={() => setView("liste")}
              aria-pressed={view === "liste"}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                view === "liste" ? "bg-violet text-white" : "text-slate hover:text-plum"
              }`}
            >
              <LayoutGrid size={16} />
              Liste
            </button>
            <button
              onClick={() => setView("carte")}
              aria-pressed={view === "carte"}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                view === "carte" ? "bg-violet text-white" : "text-slate hover:text-plum"
              }`}
            >
              <MapIcon size={16} />
              Carte
            </button>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-plum lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filtres
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-xs text-white">
                {activeCount}
              </span>
            )}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-plum outline-none focus:border-violet"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 flex gap-8">
        {/* Sidebar desktop */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              cities={cities}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
        </aside>

        {/* Résultats */}
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-sm text-slate">
              <span className="font-semibold text-plum">{results.length}</span>{" "}
              prestataire{results.length > 1 ? "s" : ""}
            </p>
            {saved.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-violet">
                <Heart size={15} className="fill-violet" />
                {saved.length} favori{saved.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {view === "carte" ? (
            <VendorsMap vendors={results} />
          ) : results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white py-20 text-center">
              <p className="font-display text-xl font-semibold text-plum">
                Aucun prestataire ne correspond
              </p>
              <p className="mt-2 text-sm text-slate">
                Essayez d&apos;élargir vos filtres.
              </p>
              <button
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  setQuery("");
                }}
                className="mt-5 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white"
              >
                Réinitialiser
              </button>
            </div>
          ) : (
            // Masonry façon Pinterest avec des colonnes CSS
            <div className="columns-1 gap-6 sm:columns-2 xl:columns-3">
              {results.map((v) => (
                <VendorCard
                  key={v.id}
                  vendor={v}
                  saved={saved.includes(v.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-plum/40"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl font-semibold text-plum">
                Filtres
              </p>
              <button
                aria-label="Fermer les filtres"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-plum"
              >
                <X size={18} />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              cities={cities}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-6 w-full rounded-xl bg-violet py-3.5 text-sm font-semibold text-white"
            >
              Voir les {results.length} résultats
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
