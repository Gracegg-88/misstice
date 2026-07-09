import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import type { ConversationListItem } from "@/lib/messaging-types";

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
}: {
  conversations: ConversationListItem[];
  basePath: string;
  activeId?: string | null;
  emptyText: string;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white">
      <div className="shrink-0 border-b border-black/5 px-5 py-4">
        <h2 className="font-display text-lg font-semibold text-plum">Messages</h2>
        <p className="text-xs text-slate">
          {conversations.length} conversation
          {conversations.length > 1 ? "s" : ""}
        </p>
      </div>

      {conversations.length === 0 ? (
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
                      <p className="truncate font-semibold text-plum">
                        {c.otherName}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate">
                        {whenLabel(c.last_message_at)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-slate">
                      {c.last_message || c.subject || "Conversation"}
                    </p>
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
