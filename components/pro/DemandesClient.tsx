"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MessageSquare, Send, FileText, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ConversationListItem } from "@/lib/messaging-types";
import type { Quote } from "@/lib/pro-types";

type DemandeStatus = "Nouvelle" | "Devis envoyé" | "Acceptée" | "Refusée";

const ALL_STATUSES: DemandeStatus[] = [
  "Nouvelle",
  "Devis envoyé",
  "Acceptée",
  "Refusée",
];

// Statut de demande → statut de devis (pour garder le devis synchronisé).
const TO_QUOTE: Record<DemandeStatus, Quote["status"] | null> = {
  Nouvelle: null,
  "Devis envoyé": "envoyé",
  Acceptée: "accepté",
  Refusée: "refusé",
};

const STYLE: Record<DemandeStatus, string> = {
  Nouvelle: "bg-festif-soft text-festif",
  "Devis envoyé": "bg-violet-soft text-violet",
  Acceptée: "bg-emerald-soft text-emerald",
  Refusée: "bg-black/5 text-slate",
};

const FILTERS: ("Toutes" | DemandeStatus)[] = [
  "Toutes",
  "Nouvelle",
  "Devis envoyé",
  "Acceptée",
  "Refusée",
];

// Statut d'un devis existant → statut affiché de la demande.
function quoteToStatus(status: Quote["status"]): DemandeStatus {
  switch (status) {
    case "accepté":
      return "Acceptée";
    case "refusé":
      return "Refusée";
    default:
      // envoyé, expiré
      return "Devis envoyé";
  }
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function DemandesClient({
  convs,
  quotes,
  embedded = false,
}: {
  convs: ConversationListItem[];
  quotes: Quote[];
  embedded?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"Toutes" | DemandeStatus>("Toutes");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Surcouche optimiste : conversation_id → statut choisi.
  const [override, setOverride] = useState<Record<string, DemandeStatus>>({});

  // Index des devis par conversation.
  // quotes est trié du plus récent au plus ancien → on garde le PREMIER vu
  // (le plus récent) pour chaque conversation, pas l'ancien.
  const quoteByConv = new Map<string, Quote>();
  for (const q of quotes) {
    if (q.conversation_id && !quoteByConv.has(q.conversation_id)) {
      quoteByConv.set(q.conversation_id, q);
    }
  }

  const statusOf = (c: ConversationListItem): DemandeStatus => {
    if (override[c.id]) return override[c.id];
    if (c.status && (ALL_STATUSES as string[]).includes(c.status))
      return c.status as DemandeStatus;
    const q = quoteByConv.get(c.id);
    return q ? quoteToStatus(q.status) : "Nouvelle";
  };

  const changeStatus = async (
    c: ConversationListItem,
    status: DemandeStatus
  ) => {
    setMenuFor(null);
    if (busy) return;
    setOverride((o) => ({ ...o, [c.id]: status }));
    setBusy(true);
    setError("");
    const supabase = createClient();

    const { error: upErr } = await supabase
      .from("conversations")
      .update({ status })
      .eq("id", c.id);

    // Garde le devis existant synchronisé avec le statut choisi.
    const q = quoteByConv.get(c.id);
    const qStatus = TO_QUOTE[status];
    if (!upErr && q && qStatus && q.status !== qStatus) {
      await supabase.from("quotes").update({ status: qStatus }).eq("id", q.id);
    }

    setBusy(false);
    if (upErr) {
      setError(upErr.message);
      setOverride((o) => {
        const n = { ...o };
        delete n[c.id];
        return n;
      });
      return;
    }
    router.refresh();
  };

  const shown = convs.filter(
    (c) => filter === "Toutes" || statusOf(c) === filter
  );

  return (
    <div className={embedded ? "" : "mx-auto max-w-4xl"}>
      {/* Ferme le menu de statut au clic à l'extérieur. */}
      {menuFor && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMenuFor(null)}
        />
      )}
      {error && <p className="mb-3 text-sm text-festif">{error}</p>}
      {!embedded && (
        <>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Demandes de devis
          </h1>
          <p className="mt-1 text-sm text-slate">
            Des familles réelles, avec un événement daté. Répondez vite : votre
            réactivité améliore votre visibilité.
          </p>
        </>
      )}

      <div className={`${embedded ? "" : "mt-6 "}flex flex-wrap gap-2`}>
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
            {f}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {shown.map((c) => {
          const status = statusOf(c);
          const quote = quoteByConv.get(c.id);
          return (
            <div
              key={c.id}
              className="rounded-3xl border border-black/5 bg-white p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-soft font-semibold text-violet">
                    {initials(c.otherName)}
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-plum">
                      {c.otherName}
                    </p>
                    <p className="text-sm text-slate">
                      {c.subject || "Demande de devis"}
                    </p>
                  </div>
                </div>

                {/* Badge de statut → bouton pour changer le statut. */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setMenuFor(menuFor === c.id ? null : c.id)
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${STYLE[status]}`}
                  >
                    {status}
                    <ChevronDown size={12} />
                  </button>
                  {menuFor === c.id && (
                    <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-black/10 bg-white p-1 shadow-lg">
                      {ALL_STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => changeStatus(c, s)}
                          className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                            s === status
                              ? "bg-violet-soft text-violet"
                              : "text-plum hover:bg-cream"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={14} />
                  {formatDate(c.last_message_at)}
                </span>
                {quote && (
                  <Link
                    href={`/devis/${quote.id}`}
                    className="inline-flex items-center gap-1.5 font-medium text-violet hover:text-violet-dark"
                  >
                    <FileText size={14} />
                    {quote.quote_number ? `${quote.quote_number} · ` : "Devis : "}
                    {quote.amount.toLocaleString("fr-FR")}€
                  </Link>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/pro/messagerie/${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-plum hover:bg-cream"
                >
                  <MessageSquare size={15} />
                  Répondre
                </Link>
                {quote ? (
                  <Link
                    href={`/pro/devis/nouveau?conv=${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-plum hover:bg-cream"
                  >
                    <Send size={15} />
                    Nouveau devis
                  </Link>
                ) : (
                  <Link
                    href={`/pro/devis/nouveau?conv=${c.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
                  >
                    <Send size={15} />
                    Envoyer un devis
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <p className="rounded-3xl border border-dashed border-black/10 bg-white py-12 text-center text-sm text-slate">
            Aucune demande pour ce filtre.
          </p>
        )}
      </div>
    </div>
  );
}
