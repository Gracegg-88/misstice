import MessagingShell from "@/components/messaging/MessagingShell";
import { getMyConversations } from "@/lib/messaging";

export default async function ProMessagerieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const all = await getMyConversations();
  // Espace prestataire : les échanges où l'utilisateur est le destinataire.
  const conversations = all.filter((c) => c.role === "prestataire");

  return (
    <MessagingShell
      conversations={conversations}
      basePath="/pro/messagerie"
      emptyText="Aucune demande pour l'instant. Les familles vous contacteront depuis votre fiche."
    >
      {children}
    </MessagingShell>
  );
}
