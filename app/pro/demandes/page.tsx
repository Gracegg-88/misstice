import ProDevisTabs from "@/components/pro/ProDevisTabs";
import { getMyConversations } from "@/lib/messaging";
import { getMyQuotes } from "@/lib/pro";

export default async function ProDemandesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const [convsAll, quotes] = await Promise.all([
    getMyConversations(),
    getMyQuotes(),
  ]);

  // « Demandes & devis » ne montre que les conversations qui sont VRAIMENT une
  // demande de devis (elles portent une `demande`) ou qui ont déjà un devis.
  // Les simples messages (sans demande) restent uniquement dans la Messagerie.
  const withQuote = new Set(
    quotes.map((q) => q.conversation_id).filter(Boolean)
  );
  const convs = convsAll.filter(
    (c) =>
      c.role === "prestataire" && (c.demande != null || withQuote.has(c.id))
  );

  return (
    <ProDevisTabs
      convs={convs}
      quotes={quotes}
      initialTab={searchParams.tab === "devis" ? "devis" : "demandes"}
    />
  );
}
