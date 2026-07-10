import Link from "next/link";
import { MessagesSquare, Users } from "lucide-react";
import type { ConversationListItem } from "@/lib/messaging-types";
import type { TeamThread } from "@/lib/team-chat";

// Heure relative courte pour l'aperçu (aujourd'hui → "14:30", sinon date).
function whenLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function ConversationList({
  conversations,
  basePath,
  activeId = null,
  emptyText,
  teams = [],
}: {
  conversations: ConversationListItem[];
  basePath: string;
  activeId?: string | null;
  emptyText: string;
  // Fils de groupe « Équipe » (un par événement) épinglés en haut.
  teams?: TeamThread[];
}) {
  const total = conversations.length + teams.length;
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white">
      <div className="shrink-0 border-b border-black/5 px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-plum">Messages</h2>
        <p className="text-xs text-slate">
          {total} conversation{total > 1 ? "s" : ""}
        </p>
      </div>

      {teams.length > 0 && (
        <ul className="shrink-0 divide-y divide-black/5 border-b border-black/5 bg-violet-soft/30">
          {teams.map((t) => {
            const active = activeId === `equipe/${t.eventId}`;
            return (
              <li key={t.eventId}>
                <Link
                  href={`${basePath}/equipe/${t.eventId}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    active ? "bg-violet-soft/70" : "hover:bg-violet-soft/60"
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet text-white">
                    <Users size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate ${t.unread > 0 ? "font-bold text-plum" : "font-semibold text-plum"}`}>
                        Équipe · {t.eventName}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate">
                        {whenLabel(t.lastAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${t.unread > 0 ? "font-medium text-plum" : "text-slate"}`}>
                        {t.lastBody || "Discussion de groupe"}
                      </p>
                      {t.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-violet px-1.5 text-[11px] font-semibold text-white">
                          {t.unread > 99 ? "99+" : t.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {conversations.length === 0 && teams.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
            <MessagesSquare size={22} />
          </div>
          <p className="mt-3 text-sm text-slate">{emptyText}</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-black/5 overflow-y-auto">
          {conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <li key={c.id}>
                <Link
                  href={`${basePath}/${c.id}`}
                  className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${
                    active ? "bg-violet-soft/50" : "hover:bg-cream"
                  }`}
                >
                  {c.otherAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.otherAvatar}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet text-sm font-semibold text-white">
                      {(c.otherName.trim()[0] || "?").toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate ${c.unread > 0 ? "font-bold text-plum" : "font-semibold text-plum"}`}>
                        {c.otherName}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate">
                        {whenLabel(c.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${c.unread > 0 ? "font-medium text-plum" : "text-slate"}`}>
                        {c.last_message || c.subject || "Conversation"}
                      </p>
                      {c.unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-violet px-1.5 text-[11px] font-semibold text-white">
                          {c.unread > 99 ? "99+" : c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
