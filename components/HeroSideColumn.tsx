/**
 * Colonne photo flanquant le titre du hero (ordinateur uniquement, Complément
 * 2 révisé) : défilement vertical lent et continu (CSS pur, voir
 * .ev-marquee-up/.ev-marquee-down dans app/animations.css).
 */
export default function HeroSideColumn({
  images,
  direction,
}: {
  images: string[];
  direction: "up" | "down";
}) {
  const anim = direction === "up" ? "ev-marquee-up" : "ev-marquee-down";
  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className={`flex flex-col gap-4 ${anim}`}>
        {[...images, ...images].map((src, i) => (
          <div key={i} className="h-60 w-full shrink-0 overflow-hidden rounded-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-ink to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-ink to-transparent"
      />
    </div>
  );
}
