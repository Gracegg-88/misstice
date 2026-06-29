import { Star, BadgeCheck, MapPin } from "lucide-react";
import Reveal from "./Reveal";

const vendors = [
  { name: "Studio Lumière", cat: "Photographe", city: "Paris", rating: 4.9, reviews: 127, price: "dès 800 €", verified: true, grad: "from-violet to-festif" },
  { name: "DJ Sankara", cat: "DJ & Sono", city: "Lyon", rating: 4.8, reviews: 94, price: "dès 450 €", verified: true, grad: "from-festif to-emerald" },
  { name: "Saveurs d'Afrique", cat: "Traiteur", city: "Marseille", rating: 5.0, reviews: 211, price: "dès 35 €/pers", verified: true, grad: "from-emerald to-violet" },
  { name: "Atelier Fleur & Co", cat: "Décoration", city: "Bordeaux", rating: 4.7, reviews: 63, price: "dès 600 €", verified: false, grad: "from-violet to-emerald" },
  { name: "Le Pavillon Royal", cat: "Salle de réception", city: "Toulouse", rating: 4.9, reviews: 158, price: "dès 2 500 €", verified: true, grad: "from-festif to-violet" },
  { name: "Douceurs de Maya", cat: "Pâtissier", city: "Nantes", rating: 4.8, reviews: 88, price: "dès 120 €", verified: true, grad: "from-emerald to-festif" },
];

export default function FeaturedVendors() {
  return (
    <section id="prestataires" className="mx-auto max-w-content px-5 py-24 sm:px-8">
      <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-festif">
            Prestataires en vedette
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-plum sm:text-5xl">
            Les pros que les familles adorent
          </h2>
        </div>
        <a
          href="/prestataires"
          className="shrink-0 rounded-xl border border-plum/15 bg-white px-5 py-2.5 text-sm font-semibold text-plum transition-colors hover:border-plum/30"
        >
          Voir tous les prestataires
        </a>
      </Reveal>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v, i) => (
          <Reveal key={v.name} delay={(i % 3) * 100}>
            <a
              href="/prestataires/1"
              className="group block h-full overflow-hidden rounded-3xl border border-black/5 bg-white transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet/5"
            >
              {/* Visuel placeholder (à remplacer par de vraies photos en phase 5) */}
              <div className={`relative h-44 bg-gradient-to-br ${v.grad}`}>
                <span className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 font-display text-lg font-semibold text-plum">
                  {v.name.charAt(0)}
                </span>
                {v.verified && (
                  <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-violet">
                    <BadgeCheck size={14} />
                    Vérifié
                  </span>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-plum">
                      {v.name}
                    </h3>
                    <p className="text-sm text-slate">{v.cat}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-cream px-2 py-1 text-sm font-semibold text-plum">
                    <Star size={14} className="fill-festif text-festif" />
                    {v.rating}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4 text-sm">
                  <span className="inline-flex items-center gap-1 text-slate">
                    <MapPin size={14} />
                    {v.city}
                  </span>
                  <span className="font-semibold text-violet">{v.price}</span>
                </div>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
