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

  const [{ data }, { data: unreadRows }] = await Promise.all([
    supabase
      .from("conversations")
      .select(CONV_SELECT)
      .order("last_message_at", { ascending: false }),
    supabase.rpc("my_unread_counts"),
  ]);
  const convs = (data as unknown as ConvRow[]) ?? [];
  const unreadByConv = new Map<string, number>(
    ((unreadRows as { conversation_id: string; unread: number }[]) ?? []).map(
      (r) => [r.conversation_id, Number(r.unread)]
    )
  );

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
      unread: unreadByConv.get(c.id) ?? 0,
    };
  });
}

/** Total des messages non lus (pour le badge de la sidebar). */
export async function getUnreadTotal(): Promise<number> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
  const { data } = await supabase.rpc("my_unread_counts");
  return ((data as { unread: number }[]) ?? []).reduce(
    (s, r) => s + Number(r.unread),
    0
  );
}

/** Une conversation (avec le nom de l'autre partie) + l'id de l'utilisateur. */
export async function getConversation(
  id: string
): Promise<{
  conv: ConversationListItem;
  userId: string;
  otherLastReadAt: string | null;
} | null> {
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

  // Dernière lecture de l'autre partie → accusé « Vu » sur mes messages.
  const otherId = iAmPrestataire ? c.particulier_id : c.prestataire_id;
  const { data: readRow } = await supabase
    .from("conversation_reads")
    .select("last_read_at")
    .eq("conversation_id", id)
    .eq("user_id", otherId)
    .maybeSingle();

  return {
    conv: {
      ...c,
      role: iAmPrestataire ? "prestataire" : "particulier",
      otherName,
      otherAvatar: otherAvatarFor(c, iAmPrestataire),
      unread: 0,
    },
    userId: user.id,
    otherLastReadAt: (readRow as { last_read_at: string } | null)?.last_read_at ?? null,
  };
}

/** Messages d'une conversation (les 100 plus récents, ordre chronologique). */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = createClient();
  // On borne le chargement (perf/DOM) : les 100 derniers messages suffisent
  // pour l'affichage ; le temps réel ajoute les nouveaux ensuite.
  const { data } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data as Message[]) ?? []).reverse();
}
