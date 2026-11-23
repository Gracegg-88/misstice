import Reveal from "./Reveal";

/**
 * Rangée de cartes-images en éventail (Complément 2, inspiration y-vision) :
 * légèrement inclinées, chevauchantes, avec une bulle façon réseau social.
 * Se redressent au scroll (chaque carte garde son angle final posé via --r,
 * voir .ev-fan-card dans app/animations.css). Glisse au doigt sur mobile.
 */
const CARDS: { src: string; alt: string; label: string; rotate: number }[] = [
  { src: "/traiteur.png", alt: "Table de réception dressée avec soin", label: "@traiteur", rotate: -7 },
  { src: "/dj.png", alt: "Ambiance musicale de soirée", label: "@dj", rotate: 4 },
  { src: "/photographe.png", alt: "Reportage photo d'un événement", label: "@photographe", rotate: -3 },
  { src: "/decoration.png", alt: "Décoration florale d'une salle de réception", label: "@déco", rotate: 6 },
  { src: "/salle.png", alt: "Salle de réception aménagée", label: "@salle", rotate: -5 },
];

export default function FanCards() {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-page pb-3 sm:snap-none sm:justify-center sm:gap-0 sm:overflow-visible sm:px-0">
      {CARDS.map((c, i) => (
        <Reveal
          key={c.label}
          variant="none"
          delay={i * 90}
          className="ev-fan-card shrink-0 snap-center sm:first:ml-0 sm:[&:not(:first-child)]:-ml-7"
          style={{ "--r": `${c.rotate}deg` } as React.CSSProperties}
        >
          <div className="relative h-44 w-32 overflow-hidden rounded-3xl shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-white/10 sm:h-56 sm:w-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt={c.alt} className="h-full w-full object-cover" />
            <span className="absolute left-2.5 top-2.5 rounded-full bg-cream/95 px-2.5 py-1 text-[11px] font-semibold text-plum shadow-sm">
              {c.label}
            </span>
          </div>
        </Reveal>
      ))}
    </div>
  );
}
