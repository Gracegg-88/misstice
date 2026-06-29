"use client";

import { Star, BadgeCheck, MapPin, Clock, Heart, Quote } from "lucide-react";
import type { Vendor } from "./vendors";

function euros(level: 1 | 2 | 3) {
  return (
    <span className="font-semibold">
      <span className="text-plum">{"€".repeat(level)}</span>
      <span className="text-slate/40">{"€".repeat(3 - level)}</span>
    </span>
  );
}

export default function VendorCard({
  vendor,
  saved,
  onToggleSave,
}: {
  vendor: Vendor;
  saved: boolean;
  onToggleSave: (id: number) => void;
}) {
  return (
    <article className="mb-6 break-inside-avoid overflow-hidden rounded-3xl border border-black/5 bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet/5">
      {/* Visuel placeholder (vraies photos en phase suivante) — zoom au survol */}
      <div
        className={`ev-zoom-hover relative ${vendor.tall ? "h-56" : "h-40"}`}
      >
        <div
          className={`ev-zoom-target absolute inset-0 bg-gradient-to-br ${vendor.grad}`}
        />
        <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/90 font-display text-lg font-semibold text-plum">
          {vendor.name.charAt(0)}
        </span>

        {/* Bouton sauvegarder (façon Pinterest) */}
        <button
          aria-label={saved ? "Retirer de mes favoris" : "Sauvegarder"}
          aria-pressed={saved}
          onClick={() => onToggleSave(vendor.id)}
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            saved
              ? "bg-violet text-white"
              : "bg-white/90 text-plum hover:bg-white"
          }`}
        >
          <Heart size={18} className={saved ? "fill-white" : ""} />
        </button>

        {vendor.verified && (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-violet">
            <BadgeCheck size={14} />
            Vérifié par Misstice
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-festif">
              {vendor.category}
            </p>
            <h3 className="mt-0.5 font-display text-lg font-semibold text-plum">
              {vendor.name}
            </h3>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-cream px-2 py-1 text-sm font-semibold text-plum">
            <Star size={14} className="fill-festif text-festif" />
            {vendor.rating.toFixed(1)}
          </span>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate">
          {vendor.tagline}
        </p>

        {/* Avis vérifié mis en avant (transparence) */}
        {vendor.reviewSnippet && (
          <div className="mt-4 rounded-2xl bg-cream p-4">
            <Quote size={16} className="text-violet/40" />
            <p className="mt-1 text-sm italic leading-relaxed text-plum">
              {vendor.reviewSnippet}
            </p>
            <p className="mt-2 text-xs text-slate">
              {vendor.reviewAuthor} · avis vérifié
            </p>
          </div>
        )}

        {/* Métadonnées de confiance */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} />
            {vendor.city}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} />
            répond en ~{vendor.responseHours}h
          </span>
          <span>·</span>
          <span>
            {vendor.reviews} avis ({vendor.responseRate}% de réponses)
          </span>
        </div>

        {/* Langues parlées (utile pour la diaspora) */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {vendor.languages.map((lang) => (
            <span
              key={lang}
              className="rounded-md bg-violet-soft px-2 py-0.5 text-xs font-medium text-violet"
            >
              {lang}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-black/5 pt-4">
          <span className="flex items-center gap-2 text-sm">
            {euros(vendor.priceLevel)}
            <span className="text-slate">· {vendor.priceFrom}</span>
          </span>
          <a
            href={`/prestataires/${vendor.id}`}
            className="rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            Voir
          </a>
        </div>
      </div>
    </article>
  );
}
