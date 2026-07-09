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
  "id, particulier_id, prestataire_id, vendor_id, vendor_name, particulier_name, particulier_avatar, demande, status, last_message, event_id, subject, last_message_at";

// On joint l'image de la fiche prestataire (table publique) pour l'afficher
// côté famille. La table vendors est lisible par tous → la jointure passe le RLS.
const CONV_SELECT = `${CONV_COLS}, vendors(image)`;

type VendorEmbed = { image: string | null };
type ConvRow = Conversation & {
  vendors?: VendorEmbed | VendorEmbed[] | null;
};

// Avatar de l'autre partie selon le point de vue.
function otherAvatarFor(c: ConvRow, iAmPrestataire: boolean): string | null {
  if (iAmPrestataire) return c.particulier_avatar ?? null;
  const v = Array.isArray(c.vendors) ? c.vendors[0] : c.vendors;
  return v?.image ?? null;
}

/** Conversations de l'utilisateur courant (famille ou prestataire). */
export async function getMyConversations(): Promise<ConversationListItem[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("conversations")
    .select(CONV_SELECT)
    .order("last_message_at", { ascending: false });
  const convs = (data as unknown as ConvRow[]) ?? [];

  return convs.map((c) => {
    const iAmPrestataire = c.prestataire_id === user.id;
    return {
      ...c,
      role: iAmPrestataire ? "prestataire" : "particulier",
      // Le prestataire ne peut pas lire le profil de la famille (RLS) : on
      // s'appuie sur le nom / l'avatar dénormalisés enregistrés à la création.
      otherName: iAmPrestataire
        ? c.particulier_name?.trim() || "Client"
        : c.vendor_name || "Prestataire",
      otherAvatar: otherAvatarFor(c, iAmPrestataire),
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
    .select(CONV_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const c = data as unknown as ConvRow;

  const iAmPrestataire = c.prestataire_id === user.id;
  const otherName = iAmPrestataire
    ? c.particulier_name?.trim() || "Client"
    : c.vendor_name || "Prestataire";

  return {
    conv: {
      ...c,
      role: iAmPrestataire ? "prestataire" : "particulier",
      otherName,
      otherAvatar: otherAvatarFor(c, iAmPrestataire),
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
