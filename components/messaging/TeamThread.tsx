"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft, Users, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { dayLabel, hourMinute } from "@/lib/date-format";
import type { TeamMessage } from "@/lib/team-chat";

/**
 * Fil de discussion de groupe « Équipe » d'un événement.
 * Tous les membres (organisateur + collaborateurs) peuvent écrire.
 */
export default function TeamThread({
  eventId,
  eventName,
  userId,
  initial,
  basePath,
}: {
  eventId: string;
  eventName: string;
  userId: string;
  initial: TeamMessage[];
  basePath: string;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<TeamMessage[]>(initial);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`team-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_messages",
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          const m = payload.new as TeamMessage;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m]
          );
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // À l'ouverture : marque lu PUIS rafraîchit les compteurs serveur.
  useEffect(() => {
    const supabase = createClient();
    let active = true;
    void supabase.rpc("mark_team_read", { p_event: eventId }).then(() => {
      if (active) router.refresh();
    });
    return () => {
      active = false;
    };
  }, [eventId, router]);

  // Nouveau message reçu pendant qu'on lit → on garde le fil marqué comme lu.
  useEffect(() => {
    const supabase = createClient();
    void supabase.rpc("mark_team_read", { p_event: eventId });
  }, [eventId, messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    setSendError("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("post_team_message", {
      p_event: eventId,
      p_body: text,
    });
    if (error || !data) {
      setSending(false);
      setSendError("Message non envoyé. Réessayez.");
      return;
    }
    const m = data as TeamMessage;
    setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    setBody("");
    setSending(false);
  };

  const fmt = hourMinute;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-white">
      <div className="flex items-center gap-3 border-b border-black/5 px-5 py-4">
        <Link
          href={basePath}
          aria-label="Retour aux conversations"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate hover:bg-cream lg:hidden"
        >
          <ArrowLeft size={18} />
        </Link>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet text-white">
          <Users size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-semibold text-plum">
            Équipe
          </p>
          <p className="truncate text-xs text-slate">{eventName}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="py-10 text-center text-sm text-slate">
            Aucun message. Écrivez le premier à votre équipe.
          </p>
        )}
        {messages.map((m, idx) => {
          const mine = m.sender_id === userId;
          const prev = messages[idx - 1];
          const showSep =
            !prev ||
            new Date(prev.created_at).toDateString() !==
              new Date(m.created_at).toDateString();
          // Regroupe les messages consécutifs d'un même expéditeur.
          const sameAuthor = prev && prev.sender_id === m.sender_id && !showSep;
          const name = m.sender_name?.trim() || "Membre";

          return (
            <Fragment key={m.id}>
              {showSep && (
                <div className="flex justify-center py-1">
                  <span className="rounded-full bg-cream px-3 py-1 text-[11px] font-medium text-slate">
                    {dayLabel(m.created_at)}
                  </span>
                </div>
              )}

              <div className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine &&
                  (sameAuthor ? (
                    <span className="w-8 shrink-0" />
                  ) : m.sender_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.sender_avatar}
                      alt=""
                      className="mt-4 h-8 w-8 shrink-0 self-start rounded-full object-cover"
                    />
                  ) : (
                    <span className="mt-4 flex h-8 w-8 shrink-0 self-start items-center justify-center rounded-full bg-violet-soft text-xs font-semibold text-violet">
                      {(name[0] || "?").toUpperCase()}
                    </span>
                  ))}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    mine ? "bg-violet text-white" : "bg-cream text-plum"
                  }`}
                >
                  {!mine && !sameAuthor && (
                    <p className="mb-0.5 text-xs font-semibold text-violet">{name}</p>
                  )}
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
            </Fragment>
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
          placeholder="Écrire à l'équipe…"
          className="max-h-32 flex-1 resize-none rounded-2xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
        />
        <button
          type="submit"
          disabled={sending || !body.trim()}
          aria-label="Envoyer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet text-white hover:bg-violet-dark disabled:opacity-50"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
}
