"use client";

import { X } from "lucide-react";

/**
 * Panneau coulissant depuis le bas (Complément 5 — édition mobile de "Ma
 * page") : ne montre que les réglages d'UNE zone à la fois. La fiche reste
 * visible et à jour derrière (fond semi-transparent, pas d'overlay opaque).
 */
export default function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center lg:hidden">
      <div className="absolute inset-0 bg-plum/30" onClick={onClose} />
      <div className="ev-fade-in relative max-h-[80vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-plum">{title}</h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-plum"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
