import { redirect } from "next/navigation";
import ConversationThread from "@/components/messaging/ConversationThread";
import { getConversation, getMessages } from "@/lib/messaging";

export default async function MessageThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const res = await getConversation(params.id);
  if (!res) redirect("/dashboard/messages");

  const messages = await getMessages(params.id);

  return (
    <ConversationThread
      conversationId={res.conv.id}
      userId={res.userId}
      otherName={res.conv.otherName}
      otherAvatar={res.conv.otherAvatar}
      otherHref={res.conv.vendor_id ? `/prestataires/${res.conv.vendor_id}` : null}
      quoteAction={
        res.conv.vendor_id
          ? {
              label: "Demander un devis",
              href: `/prestataires/${res.conv.vendor_id}?devis=1`,
            }
          : null
      }
      initial={messages}
      basePath="/dashboard/messages"
      otherLastReadAt={res.otherLastReadAt}
    />
  );
}
