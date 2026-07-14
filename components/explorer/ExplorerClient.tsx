"use client";

import { useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldCheck,
  MailX,
} from "lucide-react";
import type { Vendor } from "./vendors";
import VendorCard from "./VendorCard";
import FilterPanel, { type Filters } from "./FilterPanel";
import { useFavorites } from "@/lib/useFavorites";
import { EMPTY_VIBES, countVibes, vendorMatchesVibes } from "@/lib/vibes";

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
  vibes: { ...EMPTY_VIBES },
};

const SORTS = [
  { v: "merite", l: "Les meilleurs (au mérite)" },
  { v: "note", l: "Les mieux notés" },
  { v: "avis", l: "Le plus d'avis" },
  { v: "prix", l: "Prix croissant" },
];

// Cartes de confiance (réponses aux reproches du secteur).
const PROMISES = [
  { icon: Eye, title: "Tous les avis publiés", text: "Positifs comme négatifs, jamais supprimés contre paiement — vous lisez de vrais retours." },
  { icon: ShieldCheck, title: "Prestataires vérifiés", text: "Le badge « Vérifié » atteste d'une identité contrôlée, de coordonnées professionnelles valides et de réalisations authentifiées par notre équipe." },
  { icon: MailX, title: "Zéro spam, zéro faux lead", text: "Vous contactez qui vous voulez. Les pros reçoivent de vraies demandes, pas du bruit." },
];

const PER_PAGE = 9;

const selectCls =
  "rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-plum outline-none focus:border-violet";

export default function ExplorerClient({
  vendors,
  categories,
}: {
  vendors: Vendor[];
  categories: string[];
}) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("merite");
  const { ids: saved, toggle: toggleSave } = useFavorites();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [view, setView] = useState<"liste" | "carte">("liste");
  const [page, setPage] = useState(1);
  const resultsRef = useRef<HTMLDivElement>(null);

  const scrollToResults = () =>
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Change de page ET remonte en haut des résultats (sinon on ne voit pas le
  // changement, on reste au niveau des boutons de pagination).
  const goToPage = (p: number) => {
    setPage(p);
    scrollToResults();
  };

  // Réinitialise TOUT : filtres, recherche, tri et pagination.
  const resetAll = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery("");
    setSort("merite");
    setPage(1);
  };

  const cities = useMemo(
    () =>
      Array.from(new Set(vendors.map((v) => v.city))).sort((a, b) =>
        a.localeCompare(b, "fr")
      ),
    [vendors]
  );


  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = vendors.filter((v) => {
      if (filters.categories.length && !filters.categories.includes(v.category))
        return false;
      if (filters.city !== "all" && v.city !== filters.city) return false;
      if (filters.priceLevels.length && !filters.priceLevels.includes(v.priceLevel))
        return false;
      if (v.rating < filters.minRating) return false;
      if (!vendorMatchesVibes(v, filters.vibes)) return false;
      if (
        q &&
        ![v.name, v.category, v.city, v.tagline].join(" ").toLowerCase().includes(q)
      )
        return false;
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case "note":
          return b.rating - a.rating;
        case "avis":
          return b.reviews - a.reviews;
        case "prix":
          return a.priceLevel - b.priceLevel;
        default:
          return (
            b.rating * Math.log10(b.reviews + 1) -
            a.rating * Math.log10(a.reviews + 1)
          );
      }
    });
  }, [vendors, filters, query, sort]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = results.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const activeCount =
    filters.categories.length +
    filters.priceLevels.length +
    (filters.city !== "all" ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    countVibes(filters.vibes);

  return (
    <div>
      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden bg-cream bg-cover bg-center"
        style={{ backgroundImage: "url('/hero_prestataire.png')" }}
      >
        <div className="mx-auto max-w-content px-5 py-14 sm:px-8 lg:py-20">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-plum sm:text-5xl">
              Trouvez le prestataire{" "}
              <span className="text-festif">qui vous ressemble</span>
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate">
              Photographes, traiteurs, DJ, salles… Comparez en toute
              transparence et gardez vos favoris.
            </p>
            <p className="mt-2 max-w-lg text-base leading-relaxed text-plum/70">
              Laissez Misstice identifier ce qui vous inspire : filtrez par
              <span className="font-semibold text-violet"> ambiance, énergie et style</span>,
              et trouvez le prestataire qui vous ressemble vraiment.
            </p>
          </div>
        </div>
      </section>

      {/* ── CARTES DE CONFIANCE ── */}
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <div className="relative z-10 -mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map((p) => (
            <div
              key={p.title}
              className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-violet/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                <p.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-plum">{p.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate">{p.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── BARRE DE RECHERCHE (après les cartes) ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            scrollToResults();
          }}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-3 shadow-lg shadow-violet/5 sm:flex-row sm:items-center"
        >
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher un prestataire, une ville…"
              className="w-full rounded-xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm text-plum outline-none placeholder:text-slate focus:border-violet"
            />
          </div>

          <button
            type="submit"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            <Search size={16} />
            Rechercher
          </button>
        </form>
      </div>

      {/* ── RÉSULTATS ── */}
      <div ref={resultsRef} className="mx-auto max-w-content scroll-mt-24 px-5 py-10 sm:px-8">
        <div className="flex gap-8">
          {/* Sidebar desktop */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6">
              <FilterPanel
                filters={filters}
                setFilters={(f) => {
                  setFilters(f);
                  setPage(1);
                }}
                categories={categories}
                cities={cities}
                onReset={resetAll}
              />
            </div>
          </aside>

          {/* Colonne résultats */}
          <div className="min-w-0 flex-1">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-slate">
                <span className="font-semibold text-plum">{results.length}</span>{" "}
                prestataire{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
              </p>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <select
                  aria-label="Trier les résultats"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className={`${selectCls} min-w-0 flex-1 sm:flex-none`}
                >
                  {SORTS.map((s) => (
                    <option key={s.v} value={s.v}>{s.l}</option>
                  ))}
                </select>

                {/* Bascule Liste / Carte */}
                <div className="flex shrink-0 rounded-xl border border-black/10 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setView("liste")}
                    aria-pressed={view === "liste" ? "true" : "false"}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      view === "liste" ? "bg-violet text-white" : "text-slate hover:text-plum"
                    }`}
                  >
                    <LayoutGrid size={16} />
                    Liste
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("carte")}
                    aria-pressed={view === "carte" ? "true" : "false"}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      view === "carte" ? "bg-violet text-white" : "text-slate hover:text-plum"
                    }`}
                  >
                    <MapIcon size={16} />
                    Carte
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-plum lg:hidden"
                >
                  <SlidersHorizontal size={16} />
                  Filtres
                  {activeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet px-1.5 text-xs text-white">
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>
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
                  type="button"
                  onClick={resetAll}
                  className="mt-5 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Réinitialiser
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {paged.map((v) => (
                    <VendorCard
                      key={v.id}
                      vendor={v}
                      saved={saved.includes(v.id)}
                      onToggleSave={toggleSave}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      aria-label="Page précédente"
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-plum transition-colors hover:bg-white disabled:opacity-40"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => goToPage(p)}
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                          p === currentPage
                            ? "bg-violet text-white"
                            : "border border-black/10 text-plum hover:bg-white"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      type="button"
                      aria-label="Page suivante"
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 text-plum transition-colors hover:bg-white disabled:opacity-40"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-plum/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-xl font-semibold text-plum">Filtres</p>
              <button
                type="button"
                aria-label="Fermer les filtres"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream text-plum"
              >
                <X size={18} />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              setFilters={(f) => {
                setFilters(f);
                setPage(1);
              }}
              categories={categories}
              cities={cities}
              onReset={resetAll}
            />
            <button
              type="button"
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
