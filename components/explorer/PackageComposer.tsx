"use client";

import { useState } from "react";
import type { Pkg } from "./profileData";

/**
 * "Composer mon devis" : le client choisit une formule, un nombre d'invités,
 * puis envoie la demande de devis existante, pré-remplie. Estimation
 * indicative seulement — le prestataire confirme le devis final.
 */
export default function PackageComposer({
  packages,
  onCompose,
}: {
  packages: Pkg[];
  onCompose: (result: { wanted: string; estimateNote: string }) => void;
}) {
  const [selected, setSelected] = useState<Pkg | null>(packages[0] ?? null);
  const [guests, setGuests] = useState("");

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  if (packages.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-slate">
        Aucune formule renseignée pour le moment — demandez un devis
        directement.
      </p>
    );
  }

  const submit = () => {
    if (!selected) return;
    const parts = [`Formule souhaitée : ${selected.name} (${selected.price})`];
    if (guests.trim()) parts.push(`Nombre d'invités : ${guests.trim()}`);
    onCompose({
      wanted: parts.join("\n"),
      estimateNote: `Estimation indicative : ${selected.price}. Le prestataire confirme le devis final.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {packages.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setSelected(p)}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              selected?.name === p.name
                ? "border-violet bg-violet-soft"
                : "border-black/10 hover:border-violet/40"
            }`}
          >
            <p className="font-display text-sm font-semibold text-plum">{p.name}</p>
            <p className="mt-1 text-sm font-semibold text-violet">{p.price}</p>
          </button>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium text-plum">
          Nombre d&apos;invités (facultatif)
        </label>
        <input
          type="number"
          min={1}
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className={`mt-1.5 ${inputCls}`}
        />
      </div>
      <button
        type="button"
        onClick={submit}
        disabled={!selected}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
      >
        Continuer vers la demande de devis
      </button>
    </div>
  );
}
