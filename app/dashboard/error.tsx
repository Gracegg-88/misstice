"use client";

import { useEffect } from "react";
import { RotateCcw, AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("dashboard error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[40vh] max-w-md flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-festif-soft text-festif">
        <AlertTriangle size={24} />
      </div>
      <h1 className="mt-4 font-display text-xl font-semibold text-plum">
        Une erreur est survenue
      </h1>
      <p className="mt-1 text-sm text-slate">
        Impossible de charger cette page pour le moment. Réessayez.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
      >
        <RotateCcw size={16} />
        Réessayer
      </button>
    </div>
  );
}
