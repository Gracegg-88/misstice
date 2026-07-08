import ConversationList from "@/components/messaging/ConversationList";
import { getMyConversations } from "@/lib/messaging";

export default async function ProMessageriePage() {
  const all = await getMyConversations();
  // Seulement les demandes reçues (le prestataire est le destinataire).
  const conversations = all.filter((c) => c.role === "prestataire");

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Messagerie
      </h1>
      <p className="mt-1 text-sm text-slate">
        Les demandes de devis et échanges avec les familles.
      </p>

      <div className="mt-6">
        <ConversationList
          conversations={conversations}
          basePath="/pro/messagerie"
          emptyText="Aucune demande pour l'instant. Les familles vous contacteront depuis votre fiche."
        />
      </div>
    </div>
  );
}
