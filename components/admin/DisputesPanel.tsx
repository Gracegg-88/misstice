"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TriangleAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  MessagesSquare,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { euro } from "@/lib/quote-doc";
import type { Quote } from "@/lib/pro-types";

const REASON_LABEL: Record<string, string> = {
  prestataire_absent: "Prestataire absent le jour J",
  insatisfaction_qualite: "Insatisfaction sur la qualité",
};

type ThreadMessage = { id: string; sender_id: string; body: string; created_at: string };

// Marqueurs techniques dans le corps d'un message (mêmes regex que
// ConversationThread.tsx, côté messagerie normale) : ici on ne les rend pas
// en cartes interactives (l'admin n'a pas besoin de cliquer dessus), juste
// en texte lisible plutôt que le marquage brut "[[devis:uuid]]" illisible.
const DEVIS_RE = /^\[\[devis:([0-9a-f-]+)\]\]\s*([\s\S]*)$/i;
const IMG_RE = /^\[\[img:(.+?)\]\]$/i;
const VID_RE = /^\[\[vid:(.+?)\]\]$/i;
const DOC_RE = /^\[\[doc:(.+?)\|([\s\S]*?)\]\]$/i;

function readableBody(body: string): string {
  const devis = body.match(DEVIS_RE);
  if (devis) return `📄 ${devis[2] || "Devis"}`;
  if (IMG_RE.test(body)) return "🖼️ Image";
  if (VID_RE.test(body)) return "🎬 Vidéo";
  const doc = body.match(DOC_RE);
  if (doc) return `📎 ${doc[2] || "Document"}`;
  return body;
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function DisputesPanel({ disputed }: { disputed: Quote[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  // Échanges famille ↔ prestataire, chargés à la demande (lecture admin
  // limitée aux conversations liées à un devis ayant fait l'objet d'un
  // litige — voir la policy conv_admin_read/msg_admin_read).
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [threads, setThreads] = useState<
    Record<
      string,
      | { particulierId: string; particulierName: string; vendorName: string; messages: ThreadMessage[] }
      | "loading"
      | "error"
    >
  >({});

  const resolve = async (quoteId: string, refunded: boolean) => {
    if (busyId) return;
    setBusyId(quoteId);
    setError("");
    try {
      const res = await fetch("/api/admin/dispute/resolve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId, refunded }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Action impossible.");
      }
      setResolvedIds((prev) => new Set(prev).add(quoteId));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusyId(null);
    }
  };

  const toggleThread = async (quoteId: string, conversationId: string | null) => {
    if (openThreadId === quoteId) {
      setOpenThreadId(null);
      return;
    }
    setOpenThreadId(quoteId);
    if (!conversationId || threads[quoteId]) return;

    setThreads((prev) => ({ ...prev, [quoteId]: "loading" }));
    const supabase = createClient();
    const [{ data: conv }, { data: msgs, error: msgErr }] = await Promise.all([
      supabase
        .from("conversations")
        .select("particulier_id, particulier_name, vendor_name")
        .eq("id", conversationId)
        .maybeSingle(),
      supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true }),
    ]);
    if (msgErr || !conv) {
      setThreads((prev) => ({ ...prev, [quoteId]: "error" }));
      return;
    }
    setThreads((prev) => ({
      ...prev,
      [quoteId]: {
        particulierId: conv.particulier_id,
        particulierName: conv.particulier_name || "Client",
        vendorName: conv.vendor_name || "Prestataire",
        messages: (msgs as ThreadMessage[]) ?? [],
      },
    }));
  };

  const remaining = disputed.filter((q) => !resolvedIds.has(q.id));
  if (remaining.length === 0) return null;

  return (
    <div className="mt-6 rounded-3xl border border-festif/30 bg-festif-soft p-5">
      <p className="flex items-center gap-2 font-display text-lg font-semibold text-plum">
        <TriangleAlert size={20} className="text-festif" />
        Litiges à traiter
      </p>
      <p className="mt-1 text-sm text-slate">
        Le client a signalé un problème dans les 72h suivant l&apos;événement.
        Les cas « prestataire absent » sont normalement remboursés
        automatiquement (n&apos;apparaissent ici qu&apos;en cas d&apos;échec du
        remboursement) — les cas « insatisfaction » nécessitent une décision
        au cas par cas.
      </p>
      {error && <p className="mt-3 text-sm text-festif">{error}</p>}
      <ul className="mt-4 divide-y divide-black/5">
        {remaining.map((q) => {
          const thread = threads[q.id];
          const open = openThreadId === q.id;
          return (
            <li key={q.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-plum">
                    {q.client_name || "Client"} × {q.presta_name || "Prestataire"}
                  </p>
                  <p className="text-xs text-slate">
                    {REASON_LABEL[q.dispute_reason ?? ""] || "Motif non renseigné"} · signalé
                    le {formatDate(q.dispute_filed_at)} · {euro(q.amount)}
                    {q.vendor_amount != null && ` (part prestataire : ${euro(q.vendor_amount)})`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleThread(q.id, q.conversation_id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-plum hover:bg-cream"
                  >
                    <MessagesSquare size={13} />
                    Voir les échanges
                    <ChevronDown
                      size={13}
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(q.id, true)}
                    disabled={busyId === q.id}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-festif px-3.5 py-2 text-xs font-semibold text-white hover:bg-festif/90 disabled:opacity-60"
                  >
                    {busyId === q.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={13} />
                    )}
                    Rembourser
                  </button>
                  <button
                    type="button"
                    onClick={() => resolve(q.id, false)}
                    disabled={busyId === q.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-plum hover:bg-cream disabled:opacity-60"
                  >
                    <XCircle size={13} />
                    Rejeter
                  </button>
                </div>
              </div>

              {q.dispute_comment && (
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white px-3.5 py-2.5 text-sm text-plum">
                  « {q.dispute_comment} »
                </p>
              )}

              {open && (
                <div className="mt-3 rounded-2xl border border-black/5 bg-white p-4">
                  {thread === "loading" && (
                    <p className="text-sm text-slate">Chargement…</p>
                  )}
                  {thread === "error" && (
                    <p className="text-sm text-festif">
                      Impossible de charger les échanges.
                    </p>
                  )}
                  {thread && thread !== "loading" && thread !== "error" && (
                    thread.messages.length === 0 ? (
                      <p className="text-sm text-slate">Aucun message échangé.</p>
                    ) : (
                      <ul className="max-h-80 space-y-3 overflow-y-auto">
                        {thread.messages.map((m) => (
                          <li key={m.id} className="text-sm">
                            <p className="text-xs font-semibold text-violet">
                              {m.sender_id === thread.particulierId
                                ? thread.particulierName
                                : thread.vendorName}{" "}
                              · {formatDateTime(m.created_at)}
                            </p>
                            <p className="whitespace-pre-wrap text-plum">
                              {readableBody(m.body)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
