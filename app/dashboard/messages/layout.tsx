import MessagingShell from "@/components/messaging/MessagingShell";
import { getMyConversations } from "@/lib/messaging";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const all = await getMyConversations();
  // Espace particulier : les conversations où l'utilisateur agit en client.
  const conversations = all.filter((c) => c.role === "particulier");

  return (
    <MessagingShell
      conversations={conversations}
      basePath="/dashboard/messages"
      emptyText="Aucune conversation. Contactez un prestataire depuis l'annuaire pour démarrer."
    >
      {children}
    </MessagingShell>
  );
}
