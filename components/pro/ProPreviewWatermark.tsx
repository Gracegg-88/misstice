// Protection des aperçus contre les captures d'écran (Complément 4) :
// filigrane répété en diagonale, affiché UNIQUEMENT quand l'aperçu montre une
// option Pack Pro non payée (essai « essayer puis passer au Pro »). Ne
// remplace pas une vraie protection technique (impossible sur le web) : c'est
// un signal dissuasif, pas un verrou.
export default function ProPreviewWatermark({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
    >
      <div
        className="absolute -inset-1/2 flex flex-wrap items-center justify-center gap-x-8 gap-y-6"
        style={{ transform: "rotate(-28deg)" }}
      >
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-white/40"
          >
            Aperçu Pack Pro
          </span>
        ))}
      </div>
    </div>
  );
}
