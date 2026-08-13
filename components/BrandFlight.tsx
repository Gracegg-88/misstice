/**
 * Mise en scène discrète du symbole Misstice dans le hero.
 * Le mouvement raconte l'envol sans transformer le site en animation décorative permanente.
 */
export default function BrandFlight() {
  return (
    <div className="brand-flight" aria-hidden="true">
      <span className="brand-flight__star brand-flight__star--one">✦</span>
      <span className="brand-flight__star brand-flight__star--two">✧</span>
      <span className="brand-flight__star brand-flight__star--three">✦</span>
      <span className="brand-flight__star brand-flight__star--four">·</span>
      <span className="brand-flight__halo" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/misstice-mark.png"
        alt=""
        width={118}
        height={118}
        className="brand-flight__butterfly"
      />
    </div>
  );
}
