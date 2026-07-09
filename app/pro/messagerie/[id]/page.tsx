import { redirect } from "next/navigation";
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
    <ConversationThread
      conversationId={res.conv.id}
      userId={res.userId}
      otherName={res.conv.otherName}
      otherAvatar={res.conv.otherAvatar}
      initial={messages}
      basePath="/pro/messagerie"
    />
  );
}
