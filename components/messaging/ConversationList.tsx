import Link from "next/link";
import { MessagesSquare } from "lucide-react";
import type { ConversationListItem } from "@/lib/messaging-types";

export default function ConversationList({
  conversations,
  basePath,
  emptyText,
}: {
  conversations: ConversationListItem[];
  basePath: string;
  emptyText: string;
}) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-black/10 bg-white p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
          <MessagesSquare size={22} />
        </div>
        <p className="mt-3 text-sm text-slate">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-black/5 overflow-hidden rounded-3xl border border-black/5 bg-white">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`${basePath}/${c.id}`}
            className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-cream"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet text-sm font-semibold text-white">
              {(c.otherName.trim()[0] || "?").toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-plum">{c.otherName}</p>
              <p className="truncate text-sm text-slate">
                {c.subject || "Conversation"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-slate">
              {new Date(c.last_message_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
