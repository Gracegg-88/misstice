import {
  COVER_SHAPE_PATHS,
  GRADIENT_HEIGHT_PCT,
  type CoverShape,
  type CoverGradient,
} from "@/lib/cover-options";

/**
 * Bandeau de couverture : photo du prestataire (ou photo d'illustration), une
 * forme de bas (Pack Pro) et/ou un dégradé vers la couleur du thème (Pack
 * Pro). "droite" / "aucun" = aucune superposition, comportement gratuit
 * inchangé.
 */
export default function CoverBanner({
  imageUrl,
  isIllustration,
  shape,
  gradient,
  groundColor,
  heightClassName = "h-48 sm:h-64",
  children,
}: {
  imageUrl: string | null;
  isIllustration: boolean;
  shape: CoverShape;
  gradient: CoverGradient;
  groundColor: string;
  // Hauteur du bandeau — réduite dans l'aperçu mobile (MobilePreview.tsx).
  heightClassName?: string;
  children?: React.ReactNode;
}) {
  const gradientHeight = GRADIENT_HEIGHT_PCT[gradient];

  return (
    <div
      className={`relative overflow-hidden bg-[var(--v-surface)] ${heightClassName}`}
      style={imageUrl ? { backgroundImage: `url('${imageUrl}')`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {isIllustration && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
          Photo d&apos;illustration
        </span>
      )}

      {gradientHeight > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{
            height: `${gradientHeight}%`,
            background: `linear-gradient(to top, ${groundColor}, transparent)`,
          }}
        />
      )}

      {shape !== "droite" && (
        <svg
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-10 w-full sm:h-16"
        >
          <path d={COVER_SHAPE_PATHS[shape]} fill={groundColor} />
        </svg>
      )}

      {children}
    </div>
  );
}
