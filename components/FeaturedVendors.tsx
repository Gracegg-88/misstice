import { Star, BadgeCheck, MapPin, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { getVendors } from "@/lib/vendors";

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={13}
          className={i < full ? "fill-festif text-festif" : "fill-black/10 text-black/10"}
        />
      ))}
    </span>
  );
}

export default async function FeaturedVendors() {
  // Vraies fiches (annuaire réel), 6 premières.
  const vendors = (await getVendors()).slice(0, 6);
  if (vendors.length === 0) return null;

  return (
    <section id="prestataires" className="mx-auto max-w-[1600px] px-5 pt-6 pb-16 sm:px-8 sm:pt-8 sm:pb-20">
      <Reveal className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
          Prestataires disponibles
        </h2>
        <a
          href="/prestataires"
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-violet hover:text-violet-dark"
        >
          Voir tous les prestataires
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {vendors.map((v, i) => (
          <Reveal
            key={v.id}
            delay={(i % 3) * 80}
            className={`h-full ${i >= 2 ? "hidden sm:block" : ""}`}
          >
            <a
              href={`/prestataires/${v.id}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet/5"
            >
              <div
                className="relative h-40 overflow-hidden bg-cream"
                style={!v.img ? { background: v.grad } : undefined}
              >
                {v.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.img}
                    alt={v.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {v.verified && (
                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-violet shadow-sm">
                    <BadgeCheck size={17} />
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-base font-semibold leading-snug text-plum">
                  {v.name} — {v.city}
                </h3>

                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md bg-violet-soft px-2 py-0.5 text-xs font-semibold text-violet">
                    {v.category}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-xs text-slate">
                    <MapPin size={12} />
                    {v.city}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <span className="font-semibold text-plum">
                    {v.rating > 0 ? v.rating.toFixed(1) : "—"}
                  </span>
                  <Stars rating={v.rating} />
                  <span className="text-xs text-slate">({v.reviews})</span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                  <span className="text-lg font-bold text-violet">
                    {v.priceFrom || "Sur devis"}
                  </span>
                  <span className="rounded-md bg-emerald-soft px-2 py-1 text-xs font-semibold text-emerald">
                    Disponible
                  </span>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
