"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Quote } from "@/lib/pro-types";

type QuoteStatus = Quote["status"]; // "envoyé" | "accepté" | "refusé" | "expiré"

const STATUSES: QuoteStatus[] = ["envoyé", "accepté", "refusé", "expiré"];

const STYLE: Record<QuoteStatus, string> = {
  envoyé: "bg-violet-soft text-violet",
  accepté: "bg-emerald-soft text-emerald",
  refusé: "bg-black/5 text-slate",
  expiré: "bg-festif-soft text-festif",
};

const FILTERS: ("tous" | QuoteStatus)[] = ["tous", ...STATUSES];
const FILTER_LABEL: Record<"tous" | QuoteStatus, string> = {
  tous: "Tous",
  envoyé: "Envoyé",
  accepté: "Accepté",
  refusé: "Refusé",
  expiré: "Expiré",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export default function DevisClient({
  quotes,
  embedded = false,
}: {
  quotes: Quote[];
  embedded?: boolean;
}) {
  const router = useRouter();

  // État local synchronisé sur les props (mises à jour optimistes).
  const [list, setList] = useState<Quote[]>(quotes);
  const [filter, setFilter] = useState<"tous" | QuoteStatus>("tous");
  const [error, setError] = useState("");

  useEffect(() => {
    setList(quotes);
  }, [quotes]);

  const accepted = list.filter((q) => q.status === "accepté");
  const wonValue = accepted.reduce((s, q) => s + q.amount, 0);
  const rate = list.length
    ? Math.round((accepted.length / list.length) * 100)
    : 0;

  const shown = list.filter((q) => filter === "tous" || q.status === filter);

  const changeStatus = async (id: string, status: QuoteStatus) => {
    const prev = list;
    setList((l) => l.map((q) => (q.id === id ? { ...q, status } : q)));
    setError("");
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("quotes")
      .update({ status })
      .eq("id", id);
    if (upErr) {
      setList(prev);
      setError(upErr.message);
      return;
    }
    router.refresh();
  };

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const remove = async (id: string) => {
    const prev = list;
    setList((l) => l.filter((q) => q.id !== id));
    setError("");
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("quotes")
      .delete()
      .eq("id", id);
    if (delErr) {
      setList(prev);
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className={embedded ? "" : "mx-auto max-w-4xl"}>
      <ConfirmDialog
        open={!!confirmId}
        title="Supprimer ce devis ?"
        message="Le devis sera supprimé. Le lien partagé dans la conversation n'affichera plus rien."
        onConfirm={() => {
          if (confirmId) void remove(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
      {!embedded && (
        <>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Mes devis
          </h1>
          <p className="mt-1 text-sm text-slate">
            {list.length} devis au total
          </p>
        </>
      )}

      {/* Résumé */}
      <div className={`${embedded ? "" : "mt-6 "}grid gap-4 sm:grid-cols-3`}>
        {[
          {
            l: "Devis acceptés",
            v: `${accepted.length}/${list.length}`,
            icon: CheckCircle2,
            c: "text-emerald",
          },
          {
            l: "Taux de conversion",
            v: `${rate}%`,
            icon: Clock,
            c: "text-violet",
          },
          {
            l: "Chiffre gagné",
            v: `${wonValue.toLocaleString("fr-FR")}€`,
            icon: FileText,
            c: "text-plum",
          },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-3xl border border-black/5 bg-white p-5"
          >
            <s.icon size={20} className={s.c} />
            <p className={`mt-3 font-display text-2xl font-semibold ${s.c}`}>
              {s.v}
            </p>
            <p className="mt-1 text-sm text-slate">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-violet text-white"
                : "bg-white text-slate hover:text-plum"
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-festif">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-3xl border border-black/5 bg-white">
        <ul className="divide-y divide-black/5">
          {shown.map((q) => (
            <li
              key={q.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <Link href={`/devis/${q.id}`} className="min-w-0 group">
                <p className="truncate font-medium text-plum group-hover:text-violet">
                  {q.client_name || "Client"}
                </p>
                <p className="text-xs text-slate">
                  {q.quote_number ? `${q.quote_number} · ` : ""}
                  {q.event_label ? `${q.event_label} · ` : ""}envoyé le{" "}
                  {formatDate(q.created_at)}
                </p>
              </Link>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-semibold text-plum">
                  {q.amount.toLocaleString("fr-FR")}€
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[q.status]}`}
                >
                  {FILTER_LABEL[q.status]}
                </span>
                <select
                  value={q.status}
                  onChange={(e) =>
                    changeStatus(q.id, e.target.value as QuoteStatus)
                  }
                  aria-label={`Statut du devis ${q.client_name ?? ""}`}
                  className="rounded-xl border border-black/10 bg-cream px-2.5 py-1.5 text-xs font-medium text-plum outline-none focus:border-violet"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {FILTER_LABEL[s]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setConfirmId(q.id)}
                  aria-label="Supprimer le devis"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-festif-soft hover:text-festif"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
        {shown.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate">
            Aucun devis pour ce filtre.
          </p>
        )}
      </div>
    </div>
  );
}
