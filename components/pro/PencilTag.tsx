"use client";

import { Pencil } from "lucide-react";

/**
 * Repère discret "zone modifiable" (Complément 5) — posé en absolute par
 * l'appelant sur chaque zone de la fiche éditable sur mobile. Jamais posé sur
 * la zone de confiance (badge, avis, paiement sécurisé), non modifiable.
 */
export default function PencilTag({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Modifier : ${label}`}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-plum/70 text-white backdrop-blur-sm transition-transform active:scale-95 ${className}`}
    >
      <Pencil size={13} />
    </button>
  );
}
