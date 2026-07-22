const MESSAGE = "✦ Bientôt disponible — Test Mood & Aura ✦";

export default function PromoBanner() {
  // Le contenu est dupliqué : le défilement boucle sur translateX(-50%)
  // sans à-coup visible (la seconde moitié reprend exactement la première).
  const items = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className="mx-6 shrink-0">
      {MESSAGE}
    </span>
  ));

  return (
    <div className="overflow-hidden bg-gradient-to-r from-violet via-violet-dark to-violet py-2">
      <div className="ev-marquee-track flex w-max whitespace-nowrap text-sm font-semibold text-white">
        {items}
        {items}
      </div>
    </div>
  );
}
