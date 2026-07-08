import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ConversationThread from "@/components/messaging/ConversationThread";
import { getConversation, getMessages } from "@/lib/messaging";

export default async function ProMessageThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const res = await getConversation(params.id);
  if (!res) redirect("/pro/messagerie");

  const messages = await getMessages(params.id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/pro/messagerie"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-plum"
      >
        <ArrowLeft size={16} />
        Retour à la messagerie
      </Link>

      <div className="mt-3">
        <ConversationThread
          conversationId={res.conv.id}
          userId={res.userId}
          otherName={res.conv.otherName}
          initial={messages}
        />
      </div>
    </div>
  );
}
