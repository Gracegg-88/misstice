// Types messagerie — SANS dépendance serveur (importables côté client).

// Détails saisis par le client dans sa demande — pré-remplissent le devis.
export type DemandeDetails = {
  event_need?: string | null;
  event_date?: string | null;
  event_location?: string | null;
  guests_count?: string | null;
  client_email?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  extra?: { label: string; value: string }[];
  // Lignes de prestation pré-remplies (le prestataire n'ajoute que le prix).
  items?: { label: string; description: string; qty: number }[];
};

export type Conversation = {
  id: string;
  particulier_id: string;
  prestataire_id: string;
  vendor_id: string | null;
  vendor_name: string | null;
  particulier_name: string | null;
  demande: DemandeDetails | null;
  status: string | null;
  event_id: string | null;
  subject: string | null;
  last_message_at: string;
};

export type ConversationListItem = Conversation & {
  role: "particulier" | "prestataire";
  otherName: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
