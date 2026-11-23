"use client";

import FakeVendorCard, { type FakeVendor } from "@/components/FakeVendorCard";

/**
 * Carrousel circulaire (Complément 2, inspiration hadi-community.de) : une
 * grande roue tourne en continu en CSS pur (~90s/tour). Chaque carte est
 * contre-tournée (même durée, sens inverse) pour rester lisible pendant la
 * rotation — technique "roue de fête foraine" à l'ancienne, 100% CSS. Repli
 * mobile : bande horizontale qui boucle. Les deux animations sont
 * neutralisées par prefers-reduced-motion (voir app/animations.css).
 *
 * variant="background" (révision du 23/11) : la roue entière (centrée, pas
 * juste l'arc du haut) sert de texture animée derrière le texte du premier
 * écran de /devenir-prestataire, en très faible opacité — "les visuels en
 * fond", pour ne plus prendre de place en pleine section.
 */
const FAKE_VENDORS: FakeVendor[] = [
  { name: "Atelier Verveine", category: "Traiteur", city: "Lyon", ground: "#F7F3EC", accent: "#8C8378", heading: "#1F3D33" },
  { name: "Studio Lumen", category: "Photographe", city: "Nantes", ground: "#1E1240", accent: "#6C3CE1", heading: "#FAFAF9" },
  { name: "Maison Floréal", category: "Fleuriste", city: "Bordeaux", ground: "#FAFAF9", accent: "#A13B4A", heading: "#1E1240" },
  { name: "DJ Mirage", category: "DJ & Sono", city: "Marseille", ground: "#121212", accent: "#D9B25F", heading: "#F5EFE0" },
  { name: "Les Toiles d'Hortense", category: "Décoration", city: "Toulouse", ground: "#F1ECFD", accent: "#6C3CE1", heading: "#1E1240" },
  { name: "Pâtisserie Ambre", category: "Pâtissier", city: "Lille", ground: "#FFF8F0", accent: "#D9B25F", heading: "#5B3A1E" },
  { name: "Salle Les Verrières", category: "Salle de réception", city: "Strasbourg", ground: "#10B981", accent: "#064E3B", heading: "#F0FFF8" },
  { name: "Signé Camille", category: "Officiant", city: "Nice", ground: "#FAFAF9", accent: "#1E1240", heading: "#1E1240" },
  { name: "L'Instant Doré", category: "Vidéaste", city: "Montpellier", ground: "#FAFAF9", accent: "#D9B25F", heading: "#1E1240" },
  { name: "Caméléon Events", category: "Décoration", city: "Rennes", ground: "#1E1240", accent: "#A98BF0", heading: "#FAFAF9" },
  { name: "Mademoiselle Coiffe", category: "Coiffure & Maquillage", city: "Paris", ground: "#FFF8F0", accent: "#A13B4A", heading: "#5B3A1E" },
  { name: "Table Marine", category: "Traiteur", city: "Biarritz", ground: "#EFE9FD", accent: "#6C3CE1", heading: "#1E1240" },
];

const WHEEL_SIZE = 920;
const RADIUS = 360;

/** Roue brute (cartes placées autour du centre de sa propre boîte
 *  WHEEL_SIZE × WHEEL_SIZE) — à l'appelant de la positionner. */
function Wheel() {
  const n = FAKE_VENDORS.length;
  return (
    <div className="ev-carousel-wheel relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
      {FAKE_VENDORS.map((v, i) => {
        const angle = (360 / n) * i;
        return (
          <div
            key={v.name}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={{ transform: `rotate(${angle}deg) translateX(${RADIUS}px)` }}
          >
            <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
              <div className="ev-carousel-counter">
                <div style={{ transform: `rotate(${-angle}deg)` }}>
                  <FakeVendorCard vendor={v} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CircularCarousel({
  variant = "default",
}: {
  variant?: "default" | "background";
}) {
  if (variant === "background") {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 opacity-[0.08]"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <Wheel />
        </div>
        <div className="absolute inset-0 flex items-center opacity-[0.07] sm:hidden">
          <div className="ev-marquee-track flex w-max gap-4">
            {[...FAKE_VENDORS, ...FAKE_VENDORS].map((v, i) => (
              <FakeVendorCard key={`${v.name}-${i}`} vendor={v} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <p className="relative z-10 mb-3 text-center text-xs font-medium uppercase tracking-[0.12em] text-slate">
        Exemples de pages
      </p>

      {/* Desktop/tablette : roue circulaire, arc du haut seulement visible. */}
      <div
        aria-hidden="true"
        className="relative mx-auto hidden overflow-hidden sm:block"
        style={{ width: "100%", maxWidth: WHEEL_SIZE, height: 230 }}
      >
        <div
          className="absolute left-1/2"
          style={{ marginLeft: -WHEEL_SIZE / 2, top: -(WHEEL_SIZE - 230) }}
        >
          <Wheel />
        </div>
      </div>

      {/* Mobile : bande horizontale qui boucle (pas de cercle, lisible sans défilement vertical). */}
      <div aria-hidden="true" className="overflow-hidden sm:hidden" style={{ height: 190 }}>
        <div className="ev-marquee-track flex w-max gap-4 pl-page">
          {[...FAKE_VENDORS, ...FAKE_VENDORS].map((v, i) => (
            <FakeVendorCard key={`${v.name}-${i}`} vendor={v} />
          ))}
        </div>
      </div>
    </div>
  );
}
