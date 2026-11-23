"use client";

import { Check } from "lucide-react";
import { THEMES, isThemeSelectable } from "@/lib/themes";
import ProLockBadge from "@/components/pro/ProLockBadge";

/** Sélecteur de thème pour la fiche publique. Les thèmes "Pro" apparaissent
 *  verrouillés (nom + cadenas + aperçu) : couleurs et animations définitives
 *  arrivent avec le Pack Pro (PR2). Juste un cadenas, sans le mot « Pro »
 *  (Complément 6) — l'info-bulle porte le détail. */
export default function ThemePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (themeId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((t) => {
        const selectable = isThemeSelectable(t);
        const selected = value === t.id;
        return (
          <button
            key={t.id}
            type="button"
            disabled={!selectable}
            onClick={() => selectable && onChange(t.id)}
            aria-pressed={selected}
            className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-colors ${
              selected
                ? "border-violet ring-1 ring-violet"
                : "border-black/10 hover:border-violet/40"
            } ${!selectable ? "cursor-not-allowed opacity-90" : ""}`}
          >
            <div
              className="flex h-16 items-center justify-center rounded-xl text-xs font-semibold"
              style={{ background: t.colors.ground, color: t.colors.heading }}
            >
              <span
                className="rounded-lg px-2 py-1"
                style={{ background: t.colors.buttonBg, color: t.colors.buttonText }}
              >
                Aa
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-plum">{t.name}</p>
              {!selectable && <ProLockBadge />}
              {selected && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet text-white">
                  <Check size={12} />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
