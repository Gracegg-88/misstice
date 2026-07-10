"use client";

import { Star, BadgeCheck, MapPin, Heart } from "lucide-react";
import type { Vendor } from "./vendors";
import { vibesVisible } from "@/lib/vibes";

export default function VendorCard({
  vendor,
  saved,
  onToggleSave,
}: {
  vendor: Vendor;
  saved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const price = vendor.priceFrom.replace("dès", "À partir de");
  const note = vendor.rating > 0 ? vendor.rating.toFixed(1).replace(".", ",") : "—";
  const img = vendor.img;

  // Badges vibe (mood + énergie), masqués si la réputation est trop basse.
  const vibeBadges = vibesVisible(vendor.rating, vendor.reviews)
    ? [...vendor.moods, ...vendor.energies].slice(0, 3)
    : [];

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet/5">
      {/* Photo du prestataire — zoom au survol */}
      <div
        className="ev-zoom-hover relative h-44 shrink-0 bg-cream"
        style={!img ? { background: vendor.grad } : undefined}
      >
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={vendor.name}
            className="ev-zoom-target absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Bouton sauvegarder */}
        <button
          type="button"
          aria-label={saved ? "Retirer de mes favoris" : "Sauvegarder"}
          aria-pressed={saved}
          onClick={() => onToggleSave(vendor.id)}
          className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            saved ? "bg-violet text-white" : "bg-white/90 text-plum hover:bg-white"
          }`}
        >
          <Heart size={18} className={saved ? "fill-white" : ""} />
        </button>

        {vendor.verified && (
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-violet shadow-sm">
            <BadgeCheck size={14} />
            Vérifié par Misstice
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-festif">
          {vendor.category}
        </p>
        <h3 className="mt-0.5 font-display text-xl font-semibold text-plum">
          {vendor.name}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate">
          {vendor.tagline}
        </p>

        {/* Badges Ambiance & Vibe */}
        {vibeBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {vibeBadges.map((b) => (
              <span
                key={b}
                className="rounded-full bg-violet-soft px-2 py-0.5 text-[11px] font-medium text-violet"
              >
                {b}
              </span>
            ))}
          </div>
        )}

        {/* Note */}
        <div className="mt-3 flex items-center gap-1 text-sm">
          <Star size={15} className="fill-festif text-festif" />
          <span className="font-semibold text-plum">{note}</span>
          <span className="text-slate">({vendor.reviews} avis)</span>
        </div>

        {/* Localisation */}
        <div className="mt-2 inline-flex items-center gap-1 text-sm text-slate">
          <MapPin size={14} />
          {vendor.city}
        </div>

        {/* Pied : prix + profil */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-black/5 pt-4">
          <span className="text-sm font-semibold text-plum">{price}</span>
          <a
            href={`/prestataires/${vendor.id}`}
            className="rounded-xl border border-violet/30 px-4 py-2 text-sm font-semibold text-violet transition-colors hover:bg-violet-soft"
          >
            Voir le profil
          </a>
        </div>
      </div>
    </article>
  );
}
