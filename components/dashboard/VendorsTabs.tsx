"use client";

import { useState } from "react";
import Link from "next/link";
import { Store, Heart, FileText, ArrowRight } from "lucide-react";
import BookedVendorsClient from "@/components/dashboard/BookedVendorsClient";
import FavoriteVendorsClient from "@/components/dashboard/FavoriteVendorsClient";
import type { EventVendor, ReceivedQuote } from "@/lib/dashboard-types";

const QUOTE_STYLE: Record<string, string> = {
  accepté: "bg-emerald-soft text-emerald",
  envoyé: "bg-violet-soft text-violet",
  refusé: "bg-festif-soft text-festif",
  expiré: "bg-black/5 text-slate",
};

const fdate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function VendorsTabs({
  eventId,
  initial,
  quotes = [],
  convByVendor = {},
  canEdit = true,
}: {
  eventId: string | null;
  initial: EventVendor[];
  quotes?: ReceivedQuote[];
  convByVendor?: Record<string, string>;
  canEdit?: boolean;
}) {
  const [tab, setTab] = useState<"event" | "devis" | "favoris">("event");
  // Filtre de la page Devis (mêmes statuts que les prestataires).
  const [devisFilter, setDevisFilter] = useState<
    "Tous" | "envoyé" | "accepté" | "refusé"
  >("Tous");
  const DEVIS_FILTERS: { key: typeof devisFilter; label: string }[] = [
    { key: "Tous", label: "Tous" },
    { key: "envoyé", label: "En attente" },
    { key: "accepté", label: "Confirmé" },
    { key: "refusé", label: "Refusé" },
  ];
  const shownQuotes = quotes.filter((q) =>
    devisFilter === "Tous"
      ? true
      : devisFilter === "refusé"
        ? q.status === "refusé" || q.status === "expiré"
        : q.status === devisFilter
  );

  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-violet text-white" : "bg-white text-slate hover:text-plum"
    }`;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("event")}
          className={tabCls(tab === "event")}
        >
          <Store size={16} />
          Sur l&apos;événement
        </button>
        <button
          type="button"
          onClick={() => setTab("devis")}
          className={tabCls(tab === "devis")}
        >
          <FileText size={16} />
          Devis reçus
          {quotes.length > 0 && (
            <span
              className={`rounded-full px-1.5 text-xs ${
                tab === "devis" ? "bg-white/20 text-white" : "bg-cream text-slate"
              }`}
            >
              {quotes.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("favoris")}
          className={tabCls(tab === "favoris")}
        >
          <Heart size={16} />
          Favoris
        </button>
      </div>

      <div className="mt-6">
        {tab === "event" ? (
          eventId ? (
            <BookedVendorsClient
              key={eventId}
              eventId={eventId}
              initial={initial}
              convByVendor={convByVendor}
              canEdit={canEdit}
            />
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center">
              <p className="text-sm text-slate">
                Créez un événement pour suivre vos prestataires. Vos favoris
                restent disponibles dans l&apos;onglet « Favoris ».
              </p>
            </div>
          )
        ) : tab === "devis" ? (
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
              Devis reçus
            </h1>
            <p className="mt-1 text-sm text-slate">
              Les devis que les prestataires vous ont envoyés.
            </p>
            {quotes.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {DEVIS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setDevisFilter(f.key)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                      devisFilter === f.key
                        ? "bg-violet text-white"
                        : "bg-white text-slate hover:text-plum"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
            {shownQuotes.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center">
                <p className="text-sm text-slate">
                  {quotes.length === 0
                    ? "Aucun devis reçu pour l'instant. Demandez un devis à un prestataire depuis l'annuaire."
                    : "Aucun devis pour ce filtre."}
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {shownQuotes.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-wrap items-center gap-4 rounded-3xl border border-black/5 bg-white p-4 sm:p-5"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                      <FileText size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-semibold text-plum">
                        {q.presta_name || "Prestataire"}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-slate">
                        <span>{q.presta_category || "Devis"}</span>
                        {q.quote_number && <span>· {q.quote_number}</span>}
                        <span>· {fdate(q.created_at)}</span>
                      </p>
                    </div>
                    <span className="font-display text-lg font-semibold text-violet">
                      {Number(q.amount).toLocaleString("fr-FR")} €
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        QUOTE_STYLE[q.status] ?? "bg-black/5 text-slate"
                      }`}
                    >
                      {q.status}
                    </span>
                    <Link
                      href={`/devis/${q.id}`}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-plum/15 px-3 py-2 text-sm font-semibold text-plum hover:border-plum/30"
                    >
                      Voir le devis
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
              Mes favoris
            </h1>
            <FavoriteVendorsClient />
          </div>
        )}
      </div>
    </div>
  );
}
