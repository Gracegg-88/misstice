"use client";

import { useEffect } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";

/**
 * Filet de sécurité pour tout le site public : sans ce fichier, une erreur
 * non attrapée affichait la page 500 brute de Vercel (aucun message, aucun
 * digest exploitable). Voir app/dashboard/error.tsx pour l'équivalent côté
 * espace connecté.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("misstice error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-festif-soft text-festif">
        <AlertTriangle size={26} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-plum">
        Une erreur est survenue
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate">
        Cette page n&apos;a pas pu s&apos;afficher. Réessayez, ou revenez à
        l&apos;accueil.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-slate/60">Référence&nbsp;: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <RotateCcw size={16} />
          Réessayer
        </button>
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-plum"
        >
          Accueil
        </a>
      </div>
    </div>
  );
}
