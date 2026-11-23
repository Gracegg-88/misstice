import { Lock } from "lucide-react";

/**
 * Cadenas seul sur une option réservée au Pack Pro (Complément 6) — jamais le
 * mot "Pro" à côté. Info-bulle au survol (ordinateur) ET à l'appui (mobile,
 * via `active:`, plus fiable qu'un `:focus` sur mobile) ; `title` sert de
 * repli natif. Le nom "Pack Pro" reste réservé à la fenêtre d'incitation, au
 * comparatif et à /devenir-prestataire.
 */
export default function ProLockBadge({ size = "sm" }: { size?: "sm" | "xs" }) {
  const dim = size === "xs" ? "h-4 w-4" : "h-5 w-5";
  const iconSize = size === "xs" ? 9 : 11;
  return (
    <span className="group relative inline-flex">
      <span
        title="Inclus dans le Pack Pro"
        aria-label="Inclus dans le Pack Pro"
        className={`inline-flex items-center justify-center rounded-full bg-gold-soft text-gold-dark ${dim}`}
      >
        <Lock size={iconSize} />
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-plum px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-active:opacity-100"
      >
        Inclus dans le Pack Pro
      </span>
    </span>
  );
}
