"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BadgeCheck, ExternalLink } from "lucide-react";

export type ClaimRequestRow = {
  id: string;
  status: "en_attente" | "validee" | "refusee";
  motifRefus: string | null;
  createdAt: string;
  decidedAt: string | null;
  imported: { id: string; name: string; category: string | null; city: string | null; siret: string | null };
  claimant: {
    name: string;
    company: string | null;
    category: string | null;
    city: string | null;
    siret: string | null;
    siretVerified: boolean;
    ficheId: string | null;
  };
  /** Le prestataire a fait vérifier le même SIRET dans son espace pro. */
  siretMatch: boolean;
};

const STATUS: Record<ClaimRequestRow["status"], { label: string; cls: string }> = {
  en_attente: { label: "En attente", cls: "bg-violet-soft text-violet" },
  validee: { label: "Validée", cls: "bg-emerald-soft text-emerald" },
  refusee: { label: "Refusée", cls: "bg-garnet-soft text-garnet" },
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function ReclamationsClient({
  requests,
  tableMissing = false,
}: {
  requests: ClaimRequestRow[];
  tableMissing?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [refusing, setRefusing] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"en_attente" | "traitees">("en_attente");

  const pending = requests.filter((r) => r.status === "en_attente");
  const done = requests.filter((r) => r.status !== "en_attente");
  const list = tab === "en_attente" ? pending : done;

  const approve = async (r: ClaimRequestRow) => {
    if (
      !window.confirm(
        `Rattacher « ${r.imported.name} » au compte de ${r.claimant.name} ?\n\nLa fiche créée à l'inscription (${r.claimant.company ?? "sans nom"}) sera fusionnée dans la fiche importée puis supprimée.`
      )
    )
      return;
    setBusy(r.id);
    setError("");
    const { error: err } = await createClient().rpc("approve_vendor_claim", { p_request_id: r.id });
    setBusy(null);
    if (err) return setError(err.message);
    router.refresh();
  };

  const reject = async (r: ClaimRequestRow) => {
    setBusy(r.id);
    setError("");
    const { error: err } = await createClient().rpc("reject_vendor_claim", { p_request_id: r.id, p_motif: motif });
    setBusy(null);
    if (err) return setError(err.message);
    setRefusing(null);
    setMotif("");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">Réclamations de fiches</h1>
      <p className="mt-1 text-sm text-slate">
        Demandes de rattachement d&apos;une fiche importée (répertoire SIRENE) à un compte prestataire. Le SIRET étant
        public, vérifiez que le demandeur est bien le responsable de l&apos;entreprise avant de valider.
      </p>

      {tableMissing && (
        <p className="mt-4 rounded-2xl bg-gold-soft px-4 py-3 text-sm text-plum">
          La table des réclamations n&apos;existe pas encore (supabase/vendor-claims.sql non exécuté).
        </p>
      )}
      {error && <p className="mt-4 rounded-2xl bg-garnet-soft px-4 py-3 text-sm font-medium text-garnet">{error}</p>}

      <div className="mt-6 inline-flex gap-1 rounded-2xl bg-white p-1 shadow-sm">
        {(
          [
            ["en_attente", `En attente (${pending.length})`],
            ["traitees", `Traitées (${done.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab === k ? "bg-violet text-white" : "text-slate hover:text-plum"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-6 rounded-3xl bg-white p-8 text-center text-sm text-slate shadow-sm">
          {tab === "en_attente" ? "Aucune demande en attente." : "Aucune demande traitée."}
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {list.map((r) => (
            <article key={r.id} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[r.status].cls}`}>
                  {STATUS[r.status].label}
                </span>
                <span className="text-xs text-slate">
                  Demandée le {fmt(r.createdAt)}
                  {r.decidedAt ? ` · traitée le ${fmt(r.decidedAt)}` : ""}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-cream p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">Fiche importée</p>
                  <p className="mt-1 font-display text-lg font-semibold text-plum">{r.imported.name}</p>
                  <p className="text-sm text-slate">{[r.imported.category, r.imported.city].filter(Boolean).join(" · ")}</p>
                  {r.imported.siret && <p className="mt-1 text-xs text-slate">SIRET {r.imported.siret}</p>}
                  <a
                    href={`/prestataires/${r.imported.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet hover:text-violet-dark"
                  >
                    Voir la fiche <ExternalLink size={12} />
                  </a>
                </div>
                <div className="rounded-2xl bg-cream p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate">Demandeur</p>
                  <p className="mt-1 font-display text-lg font-semibold text-plum">{r.claimant.name}</p>
                  <p className="text-sm text-slate">
                    {[r.claimant.company, r.claimant.category, r.claimant.city].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-slate">
                    {r.claimant.siret
                      ? `SIRET déclaré ${r.claimant.siret}${r.claimant.siretVerified ? " (vérifié)" : " (non vérifié)"}`
                      : "Aucun SIRET déclaré"}
                  </p>
                  {r.claimant.ficheId && (
                    <a
                      href={`/prestataires/${r.claimant.ficheId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet hover:text-violet-dark"
                    >
                      Fiche créée à l&apos;inscription <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              {r.status === "en_attente" &&
                (r.siretMatch ? (
                  <p className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-soft px-4 py-2.5 text-sm text-emerald">
                    <BadgeCheck size={16} /> Le demandeur a fait vérifier le même SIRET dans son espace pro.
                  </p>
                ) : (
                  <p className="mt-4 rounded-2xl bg-gold-soft px-4 py-2.5 text-sm text-plum">
                    SIRET du demandeur non vérifié ou différent : contactez-le pour confirmer avant de valider.
                  </p>
                ))}

              {r.status === "refusee" && r.motifRefus && (
                <p className="mt-4 text-sm text-slate">Motif du refus : {r.motifRefus}</p>
              )}

              {r.status === "en_attente" && (
                <div className="mt-4">
                  {refusing === r.id ? (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={motif}
                        onChange={(e) => setMotif(e.target.value)}
                        placeholder="Motif du refus (visible par le prestataire)"
                        className="flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
                      />
                      <button
                        onClick={() => reject(r)}
                        disabled={busy === r.id}
                        className="rounded-xl bg-garnet px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Confirmer le refus
                      </button>
                      <button onClick={() => setRefusing(null)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate">
                        Annuler
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => approve(r)}
                        disabled={busy === r.id}
                        className="rounded-xl bg-emerald px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {busy === r.id ? "Rattachement…" : "Valider et fusionner"}
                      </button>
                      <button
                        onClick={() => {
                          setRefusing(r.id);
                          setMotif("");
                        }}
                        className="rounded-xl border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-plum hover:bg-cream"
                      >
                        Refuser
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
