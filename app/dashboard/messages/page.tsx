import ConversationList from "@/components/messaging/ConversationList";
import { getMyConversations } from "@/lib/messaging";

export default async function MessagesPage() {
  const all = await getMyConversations();
  // Seulement les échanges où l'utilisateur agit en client (demandes envoyées).
  const conversations = all.filter((c) => c.role === "particulier");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Messages
      </h1>
      <p className="mt-1 text-sm text-slate">
        Vos échanges avec les prestataires contactés.
      </p>

      <div className="mt-6">
        <ConversationList
          conversations={conversations}
          basePath="/dashboard/messages"
          emptyText="Aucune conversation. Contactez un prestataire depuis l'annuaire pour démarrer."
        />
      </div>
    </div>
  );
}
