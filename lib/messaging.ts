import { createClient } from "@/lib/supabase/server";
import type {
  Conversation,
  ConversationListItem,
  Message,
} from "@/lib/messaging-types";

export type {
  Conversation,
  ConversationListItem,
  Message,
} from "@/lib/messaging-types";

const CONV_COLS =
  "id, particulier_id, prestataire_id, vendor_id, vendor_name, particulier_name, demande, status, event_id, subject, last_message_at";

/** Conversations de l'utilisateur courant (famille ou prestataire). */
export async function getMyConversations(): Promise<ConversationListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("conversations")
    .select(CONV_COLS)
    .order("last_message_at", { ascending: false });
  const convs = (data as Conversation[]) ?? [];

  return convs.map((c) => {
    const iAmPrestataire = c.prestataire_id === user.id;
    return {
      ...c,
      role: iAmPrestataire ? "prestataire" : "particulier",
      // Le prestataire ne peut pas lire le profil de la famille (RLS) : on
      // s'appuie sur le nom dénormalisé enregistré à la création.
      otherName: iAmPrestataire
        ? c.particulier_name?.trim() || "Client"
        : c.vendor_name || "Prestataire",
    };
  });
}

/** Une conversation (avec le nom de l'autre partie) + l'id de l'utilisateur. */
export async function getConversation(
  id: string
): Promise<{ conv: ConversationListItem; userId: string } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("conversations")
    .select(CONV_COLS)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const c = data as Conversation;

  const iAmPrestataire = c.prestataire_id === user.id;
  const otherName = iAmPrestataire
    ? c.particulier_name?.trim() || "Client"
    : c.vendor_name || "Prestataire";

  return {
    conv: {
      ...c,
      role: iAmPrestataire ? "prestataire" : "particulier",
      otherName,
    },
    userId: user.id,
  };
}

/** Messages d'une conversation (ordre chronologique). */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data as Message[]) ?? [];
}
