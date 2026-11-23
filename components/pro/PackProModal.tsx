"use client";

// Fenêtre d'incitation au Pack Pro (Complément 4) : annoncée par la mascotte
// (même silhouette que GuideMascot, voir components/GuideMascot.tsx), avec 3
// points forts fixes et la liste dynamique des options Pro essayées par le
// prestataire. Ne doit JAMAIS s'afficher à un compte qui a déjà accès au Pack
// Pro (vérifié par l'appelant via hasPackProAccess) — ce composant ne revérifie
// pas les droits lui-même, il ne fait qu'afficher ce qu'on lui demande.

const BULLETS = [
  "Thèmes premium et animés",
  "Statistiques : d'où viennent tes clients (Instagram, QR code, WhatsApp…)",
  "Carte de visite personnalisable en HD, sans bandeau",
];

function joinFr(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

export default function PackProModal({
  open,
  triedOptions,
  onUpgrade,
  onSaveWithoutPro,
  onContinueEditing,
}: {
  open: boolean;
  // Libellés des options Pro essayées, ex. ["la couverture courbe", "le dégradé"].
  triedOptions: string[];
  onUpgrade: () => void;
  onSaveWithoutPro: () => void;
  onContinueEditing: () => void;
}) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-pro-modal-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-plum/55 px-4"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-xl">
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 64 64" className="h-11 w-11 shrink-0" aria-hidden="true">
            <path
              d="M32 2 Q32 12 42 12 Q32 12 32 22 Q32 12 22 12 Q32 12 32 2 Z"
              fill="#D9B25F"
            />
            <circle cx="32" cy="38" r="20" fill="#FAFAF9" />
            <circle cx="25" cy="36" r="2.6" fill="#1E1240" />
            <circle cx="39" cy="36" r="2.6" fill="#1E1240" />
            <path
              d="M25 43 Q32 48 39 43"
              stroke="#1E1240"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="inline-flex items-center rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-dark">
            Pack Pro
          </span>
        </div>

        <h2
          id="pack-pro-modal-title"
          className="mt-4 font-display text-2xl font-semibold leading-tight text-plum"
        >
          Ces options font partie du Pack Pro
        </h2>

        {triedOptions.length > 0 && (
          <p className="mt-2 text-sm leading-relaxed text-slate">
            Tu as essayé {joinFr(triedOptions)}. Avec le Pack Pro&nbsp;:
          </p>
        )}

        <div className="mt-3 flex flex-col gap-1.5 rounded-xl bg-violet-soft p-3.5 text-sm text-plum">
          {BULLETS.map((b) => (
            <span key={b}>◆ {b}</span>
          ))}
          <span className="italic text-slate">… et bien d&apos;autres avantages</span>
        </div>

        <p className="mt-3 text-sm text-plum">
          <strong>9&nbsp;€/mois</strong> ou <strong>79&nbsp;€/an</strong> · sans
          engagement
        </p>

        <div className="mt-4 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onUpgrade}
            className="rounded-full bg-plum px-5 py-3.5 text-center text-sm font-semibold text-white hover:opacity-90"
          >
            Passer au Pack Pro
          </button>
          <button
            type="button"
            onClick={onSaveWithoutPro}
            className="rounded-full border border-plum px-5 py-3 text-center text-sm font-medium text-plum hover:bg-plum/5"
          >
            Enregistrer sans les options Pro
          </button>
          <button
            type="button"
            onClick={onContinueEditing}
            className="text-center text-sm text-slate hover:text-plum"
          >
            Continuer à modifier
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-slate">
          Tes essais sont gardés en brouillon&nbsp;: tu ne perds rien.
        </p>
      </div>
    </div>
  );
}
