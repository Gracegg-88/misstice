"use client";

import { AlertTriangle } from "lucide-react";

/** Modale de confirmation réutilisable (remplace window.confirm). */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Supprimer",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-plum/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-festif-soft text-festif">
          <AlertTriangle size={22} />
        </span>
        <h3 className="mt-4 font-display text-xl font-semibold text-plum">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-black/10 py-2.5 text-sm font-semibold text-plum transition-colors hover:bg-cream"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 rounded-xl bg-festif py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
