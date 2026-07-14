import { redirect } from "next/navigation";
import DevisForm from "@/components/pro/DevisForm";
import { getConversation, getMyConversations } from "@/lib/messaging";
import { getMyVendor } from "@/lib/pro";
import { createClient } from "@/lib/supabase/server";

export default async function NouveauDevisPage({
  searchParams,
}: {
  searchParams: { conv?: string };
}) {
  const convId = searchParams.conv;
  const vendor = await getMyVendor();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?next=/pro/devis/nouveau");

  // Pré-remplissage des coordonnées : on récupère celles du dernier devis émis
  // (elles ne sont pas stockées ailleurs), pour éviter de les retaper à chaque fois.
  const { data: lastQuote } = await supabase
    .from("quotes")
    .select("presta_phone, presta_address")
    .eq("prestataire_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const common = {
    prestataireId: user.id,
    prestaName: vendor?.company ?? "Prestataire",
    prestaCategory: vendor?.category ?? null,
    prestaEmail: user.email ?? "",
    prestaPhone: (lastQuote as { presta_phone: string | null } | null)?.presta_phone ?? "",
    prestaAddress:
      (lastQuote as { presta_address: string | null } | null)?.presta_address ?? "",
  };

  // Mode ciblé : devis lié à une conversation précise (depuis « Rédiger » d'une
  // conversation ou une demande de devis).
  if (convId) {
    const result = await getConversation(convId);
    if (!result || result.conv.role !== "prestataire") redirect("/pro/demandes");
    return (
      <DevisForm
        {...common}
        conversationId={result.conv.id}
        clientName={result.conv.otherName}
        eventLabel={result.conv.subject}
        demande={result.conv.demande}
      />
    );
  }

  // Mode BROUILLON : le prestataire rédige librement et choisit le client à
  // l'envoi parmi ses conversations.
  const all = await getMyConversations();
  const conversations = all
    .filter((c) => c.role === "prestataire")
    .map((c) => ({ id: c.id, clientName: c.otherName }));

  return (
    <DevisForm
      {...common}
      conversationId={null}
      eventLabel={null}
      demande={null}
      conversations={conversations}
    />
  );
}
