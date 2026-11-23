"use client";

import { OPTIONAL_BUTTONS, isButtonEnabled } from "@/lib/button-config";

/**
 * Onglet « Ma page » → Boutons : « Demander un devis » et « Envoyer un
 * message » restent toujours affichés (cœur du modèle Misstice, non
 * désactivables). Seuls les boutons secondaires sont réglables.
 */
export default function ButtonsPicker({
  buttonConfig,
  onToggle,
}: {
  buttonConfig: string[];
  onToggle: (id: "disponibilites" | "composer") => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 opacity-70">
        <span className="text-sm font-medium text-plum">Demander un devis</span>
        <span className="text-xs text-slate">Toujours affiché</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-cream px-4 py-3 opacity-70">
        <span className="text-sm font-medium text-plum">Envoyer un message</span>
        <span className="text-xs text-slate">Toujours affiché</span>
      </div>
      {OPTIONAL_BUTTONS.map((b) => {
        const on = isButtonEnabled(buttonConfig, b.id);
        return (
          <label
            key={b.id}
            className="flex items-center justify-between rounded-xl border border-black/10 px-4 py-3"
          >
            <span className="text-sm font-medium text-plum">{b.label}</span>
            <input
              type="checkbox"
              checked={on}
              onChange={() => onToggle(b.id)}
              className="h-5 w-5 rounded border-black/20 accent-violet"
            />
          </label>
        );
      })}
    </div>
  );
}
