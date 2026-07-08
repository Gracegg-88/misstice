"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Send, FileText, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/messaging-types";

// Un message-devis : "[[devis:<id>]] <libellé>".
const DEVIS_RE = /^\[\[devis:([0-9a-f-]+)\]\]\s*([\s\S]*)$/i;

export default function ConversationThread({
  conversationId,
  userId,
  otherName,
  initial,
}: {
  conversationId: string;
  userId: string;
  otherName: string;
  initial: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Défilement vers le bas à chaque nouveau message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Temps réel : écoute les nouveaux messages de cette conversation.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError("");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, body: text })
      .select("id, conversation_id, sender_id, body, created_at")
      .single();
    setSending(false);
    if (error || !data) {
      // On garde le texte saisi pour ne pas le perdre.
      setSendError("Message non envoyé. Réessayez.");
      return;
    }
    setMessages((prev) =>
      prev.some((x) => x.id === (data as Message).id)
        ? prev
        : [...prev, data as Message]
    );
    setBody("");
  };

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col rounded-3xl border border-black/5 bg-white">
      <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet text-sm font-semibold text-white">
          {(otherName.trim()[0] || "?").toUpperCase()}
        </span>
        <p className="font-display text-lg font-semibold text-plum">{otherName}</p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate">
            Aucun message pour l&apos;instant.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          const devis = m.body.match(DEVIS_RE);
          if (devis) {
            const [, quoteId, label] = devis;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <Link
                  href={`/devis/${quoteId}`}
                  className="max-w-[80%] rounded-2xl border border-violet/20 bg-white p-4 shadow-sm transition-colors hover:border-violet"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                      <FileText size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold text-plum">
                        {label.trim() || "Devis"}
                      </p>
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-violet">
                        Voir le devis <ArrowRight size={12} />
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-slate">
                    {fmt(m.created_at)}
                  </p>
                </Link>
              </div>
            );
          }
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "bg-violet text-white"
                    : "bg-cream text-plum"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={`mt-1 text-[11px] ${
                    mine ? "text-white/70" : "text-slate"
                  }`}
                >
                  {fmt(m.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="border-t border-black/5 px-4 pt-2 text-xs font-medium text-festif">
          {sendError}
        </p>
      )}
      <form
        onSubmit={send}
        className="flex items-end gap-2 border-t border-black/5 p-3"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send(e as unknown as React.FormEvent);
            }
          }}
          rows={1}
          placeholder="Écrire un message…"
          className="max-h-32 flex-1 resize-none rounded-2xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          aria-label="Envoyer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet text-white hover:bg-violet-dark disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
