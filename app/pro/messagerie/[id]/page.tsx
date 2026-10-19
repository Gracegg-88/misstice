import { redirect } from "next/navigation";
import ConversationThread from "@/components/messaging/ConversationThread";
import { getConversation, getMessages, getProjectContext } from "@/lib/messaging";
import { getMyPaymentsStatus } from "@/lib/pro";

export default async function ProMessageThreadPage({
  params,
}: {
  params: { id: string };
}) {
  const res = await getConversation(params.id);
  if (!res) redirect("/pro/messagerie");

  const [messages, projectContext, payments] = await Promise.all([
    getMessages(params.id),
    res.conv.event_id ? getProjectContext(params.id) : Promise.resolve(null),
    getMyPaymentsStatus(),
  ]);

  return (
    <ConversationThread
      conversationId={res.conv.id}
      userId={res.userId}
      otherName={res.conv.otherName}
      otherAvatar={res.conv.otherAvatar}
      quoteAction={{
        // Sans paiements actifs, le lien mène à l'encart d'activation Stripe.
        label: payments.payoutsEnabled
          ? "Rédiger un devis"
          : "Activer mes paiements pour envoyer un devis",
        href: `/pro/devis/nouveau?conv=${res.conv.id}`,
      }}
      initial={messages}
      basePath="/pro/messagerie"
      otherLastReadAt={res.otherLastReadAt}
      projectContext={projectContext}
    />
  );
}
