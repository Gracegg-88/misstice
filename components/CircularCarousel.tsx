"use client";

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
 * écran de /devenir-prestataire, en faible opacité — "les visuels en fond".
 *
 * Images (révision du 24/11) : mockups de téléphones générés par IA fournis
 * par Grâce (exemples de fiches prestataires imaginaires), détourés sur fond
 * transparent — à la place des cartes dessinées en CSS. public/devenir/mockup-*.webp.
 */
const MOCKUP_IMAGES = [
  "/devenir/mockup-dj-hand.webp",
  "/devenir/mockup-hortense.webp",
  "/devenir/mockup-saveurs.webp",
  "/devenir/mockup-ignis.webp",
  "/devenir/mockup-horizon.webp",
  "/devenir/mockup-gabriel.webp",
  "/devenir/mockup-floral.webp",
  "/devenir/mockup-elise.webp",
  "/devenir/mockup-dj-dark.webp",
];

const WHEEL_SIZE = 920;
const RADIUS = 360;

/** Roue brute (images placées autour du centre de sa propre boîte
 *  WHEEL_SIZE × WHEEL_SIZE) — à l'appelant de la positionner. */
function Wheel() {
  const n = MOCKUP_IMAGES.length;
  return (
    <div className="ev-carousel-wheel relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
      {MOCKUP_IMAGES.map((src, i) => {
        const angle = (360 / n) * i;
        return (
          <div
            key={src}
            className="absolute left-1/2 top-1/2 h-0 w-0"
            style={{ transform: `rotate(${angle}deg) translateX(${RADIUS}px)` }}
          >
            <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
              <div className="ev-carousel-counter">
                <div style={{ transform: `rotate(${-angle}deg)` }}>
                  <img
                    src={src}
                    alt=""
                    className="h-56 w-auto max-w-none object-contain drop-shadow-[0_14px_24px_rgba(30,18,64,0.25)] sm:h-64"
                  />
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
          className="absolute left-1/2 top-1/2 opacity-[0.14]"
          style={{ transform: "translate(-50%, -50%)" }}
        >
          <Wheel />
        </div>
        <div className="absolute inset-0 flex items-center opacity-[0.12] sm:hidden">
          <div className="ev-marquee-track flex w-max items-center gap-6">
            {[...MOCKUP_IMAGES, ...MOCKUP_IMAGES].map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt=""
                className="h-48 w-auto shrink-0 object-contain drop-shadow-[0_14px_24px_rgba(30,18,64,0.25)]"
              />
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
      <div aria-hidden="true" className="overflow-hidden sm:hidden" style={{ height: 240 }}>
        <div className="ev-marquee-track flex w-max items-center gap-6 pl-page">
          {[...MOCKUP_IMAGES, ...MOCKUP_IMAGES].map((src, i) => (
            <img
              key={`${src}-${i}`}
              src={src}
              alt=""
              className="h-56 w-auto shrink-0 object-contain drop-shadow-[0_14px_24px_rgba(30,18,64,0.25)]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
