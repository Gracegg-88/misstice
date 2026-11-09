"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Check, X } from "lucide-react";
import GooglePlaceCard, { googlePlacesEnabled } from "@/components/google/GooglePlaceCard";

type Status = "a_valider" | "valide" | null;

/**
 * Lier une fiche Misstice à sa fiche Google : recherche (place_id seulement,
 * côté serveur), aperçu officiel Google de chaque candidat (Places UI Kit),
 * puis confirmation manuelle.
 *  - mode "admin" : le lien choisi est VALIDÉ (public) ; un lien proposé par
 *    le prestataire peut être validé ou refusé.
 *  - mode "pro"   : le lien choisi passe « à valider » par Misstice.
 */
export default function GooglePlaceLinker({
  mode,
  vendorId,
  defaultQuery,
  placeId,
  status,
}: {
  mode: "admin" | "pro";
  vendorId?: string;
  defaultQuery: string;
  placeId: string | null;
  status: Status;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);
  const [candidates, setCandidates] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endpoint = mode === "admin" ? "/api/admin/google-places" : "/api/vendor/google-place";

  const call = async (payload: Record<string, unknown>) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, ...(vendorId ? { vendorId } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Action impossible.");
      return data as { placeIds?: string[] };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action impossible.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const search = async () => {
    const data = await call({ action: "search", query });
    if (data) setCandidates(data.placeIds ?? []);
  };

  const link = async (id: string) => {
    if (await call({ action: "link", placeId: id })) {
      setCandidates(null);
      router.refresh();
    }
  };

  const unlink = async () => {
    if (await call({ action: "unlink" })) router.refresh();
  };

  if (!googlePlacesEnabled) {
    return (
      <p className="text-sm text-slate">
        La connexion à Google n&apos;est pas encore activée sur Misstice.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {placeId && (
        <div className="rounded-2xl border border-black/10 bg-white p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
            {status === "valide"
              ? "Fiche Google liée (visible sur la fiche publique)"
              : mode === "admin"
                ? "Proposée par le prestataire, à valider"
                : "En attente de validation par Misstice"}
          </p>
          <GooglePlaceCard placeId={placeId} variant="preview" />
          <div className="mt-3 flex flex-wrap gap-2">
            {mode === "admin" && status === "a_valider" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => link(placeId)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                <Check size={15} /> Valider
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={unlink}
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-2 text-sm font-semibold text-plum hover:border-violet/40 disabled:opacity-60"
            >
              <X size={15} /> {mode === "admin" && status === "a_valider" ? "Refuser" : "Retirer le lien"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher la fiche Google"
          placeholder="Nom de l'entreprise et ville"
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-violet"
        />
        <button
          type="button"
          disabled={busy || !query.trim()}
          onClick={search}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-plum hover:border-violet/40 disabled:opacity-60"
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Rechercher sur Google
        </button>
      </div>

      {error && <p className="text-sm text-festif">{error}</p>}

      {candidates && candidates.length === 0 && (
        <p className="text-sm text-slate">
          Aucune fiche Google trouvée. Essayez avec le nom exact affiché sur Google Maps.
        </p>
      )}

      {candidates && candidates.length > 0 && (
        <ul className="space-y-3">
          {candidates.map((id) => (
            <li key={id} className="rounded-2xl border border-black/10 bg-white p-3">
              <GooglePlaceCard placeId={id} variant="preview" />
              <button
                type="button"
                disabled={busy || id === placeId}
                onClick={() => link(id)}
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                <Check size={15} />
                {mode === "admin" ? "Valider ce lieu" : "C'est ma fiche"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
