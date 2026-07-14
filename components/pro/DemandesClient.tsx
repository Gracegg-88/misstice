"use client";

import Link from "next/link";
import { Calendar, MessageSquare, Send, FileText } from "lucide-react";
import type { ConversationListItem } from "@/lib/messaging-types";
import type { Quote } from "@/lib/pro-types";

type DemandeStatus =
  | "Nouvelle"
  | "Devis envoyé"
  | "Acceptée"
  | "Refusée"
  | "Expiré";

const ALL_STATUSES: DemandeStatus[] = [
  "Nouvelle",
  "Devis envoyé",
  "Acceptée",
  "Refusée",
  "Expiré",
];

const STYLE: Record<DemandeStatus, string> = {
  Nouvelle: "bg-festif-soft text-festif",
  "Devis envoyé": "bg-violet-soft text-violet",
  Acceptée: "bg-emerald-soft text-emerald",
  Refusée: "bg-black/5 text-slate",
  Expiré: "bg-black/5 text-slate",
};

// Statut d'un devis existant → statut affiché de la demande.
function quoteToStatus(status: Quote["status"]): DemandeStatus {
  switch (status) {
    case "accepté":
      return "Acceptée";
    case "refusé":
      return "Refusée";
    case "expiré":
      return "Expiré";
    default:
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
  // Index des devis par conversation (le plus récent d'abord).
  const quoteByConv = new Map<string, Quote>();
  for (const q of quotes) {
    if (q.conversation_id && !quoteByConv.has(q.conversation_id)) {
      quoteByConv.set(q.conversation_id, q);
    }
  }

  // Indicateur (lecture seule) : la gestion se fait dans « Mes devis ».
  const statusOf = (c: ConversationListItem): DemandeStatus => {
    if (c.status && (ALL_STATUSES as string[]).includes(c.status))
      return c.status as DemandeStatus;
    const q = quoteByConv.get(c.id);
    return q ? quoteToStatus(q.status) : "Nouvelle";
  };

  const shown = convs;

  return (
    <div className={embedded ? "" : "mx-auto max-w-4xl"}>
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

      <div className={`${embedded ? "" : "mt-6 "}space-y-4`}>
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
                  {c.otherAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.otherAvatar}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-soft font-semibold text-violet">
                      {initials(c.otherName)}
                    </span>
                  )}
                  <div>
                    <p className="font-display text-lg font-semibold text-plum">
                      {c.otherName}
                    </p>
                    <p className="text-sm text-slate">
                      {c.subject || "Demande de devis"}
                    </p>
                  </div>
                </div>

                {/* Indicateur simple (lecture seule) : la gestion des statuts
                    de devis se fait dans « Mes devis ». */}
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[status]}`}
                >
                  {status}
                </span>
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
