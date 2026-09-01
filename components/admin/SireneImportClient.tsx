"use client";

import { useState } from "react";
import { Search, Download, Loader2 } from "lucide-react";

type Suggestion = {
  citySlug: string;
  cityName: string;
  category: string;
  available: number;
  active: number;
};

type ImportResult = {
  imported: number;
  skippedLegalForm: number;
  skippedDuplicate: number;
};

export default function SireneImportClient() {
  const [scanning, setScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ImportResult>>({});

  const key = (s: Suggestion) => `${s.citySlug}::${s.category}`;

  const scan = async () => {
    setScanning(true);
    setError("");
    setSuggestions(null);
    try {
      const res = await fetch("/api/admin/sirene/scan", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Le scan a échoué.");
      setSuggestions(data.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setScanning(false);
    }
  };

  const importCombo = async (s: Suggestion) => {
    const k = key(s);
    setBusyKey(k);
    setError("");
    try {
      const res = await fetch("/api/admin/sirene/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ citySlug: s.citySlug, category: s.category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "L'import a échoué.");
      setResults((prev) => ({
        ...prev,
        [k]: { imported: data.imported, skippedLegalForm: data.skippedLegalForm, skippedDuplicate: data.skippedDuplicate },
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Import SIRENE
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-slate">
        Scanne les couples ville×catégorie qui manquent de fiches actives et
        propose d&apos;importer des entreprises réelles (sociétés uniquement,
        jamais d&apos;EI/micro-entreprise) depuis le répertoire officiel des
        entreprises françaises, triées par volume disponible décroissant.
      </p>

      <button
        type="button"
        onClick={scan}
        disabled={scanning}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-60"
      >
        {scanning ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        {scanning ? "Scan en cours…" : "Lancer un scan"}
      </button>

      {error && (
        <p className="mt-3 rounded-xl bg-festif-soft px-4 py-2 text-sm font-medium text-festif">
          {error}
        </p>
      )}

      {suggestions && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
                  <th className="px-5 py-3 font-medium">Ville</th>
                  <th className="px-5 py-3 font-medium">Catégorie</th>
                  <th className="px-5 py-3 font-medium">Disponibles</th>
                  <th className="px-5 py-3 font-medium">Déjà actives</th>
                  <th className="px-5 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate">
                      Aucun couple ville×catégorie en manque de fiches pour l&apos;instant.
                    </td>
                  </tr>
                )}
                {suggestions.map((s) => {
                  const k = key(s);
                  const result = results[k];
                  return (
                    <tr key={k} className="border-b border-black/5 last:border-0">
                      <td className="px-5 py-3 font-medium text-plum">{s.cityName}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-md bg-festif-soft px-2 py-0.5 text-xs font-semibold text-festif">
                          {s.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-plum">{s.available}</td>
                      <td className="px-5 py-3 text-slate">{s.active}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {result ? (
                            <span className="text-xs text-slate">
                              {result.imported} importée{result.imported > 1 ? "s" : ""}
                              {result.skippedDuplicate > 0 ? ` · ${result.skippedDuplicate} déjà connue(s)` : ""}
                              {result.skippedLegalForm > 0 ? ` · ${result.skippedLegalForm} écartée(s) (EI/micro-entreprise ou incomplète)` : ""}
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={busyKey === k}
                              onClick={() => importCombo(s)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:border-violet/40 disabled:opacity-60"
                            >
                              {busyKey === k ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Download size={14} />
                              )}
                              Importer
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
