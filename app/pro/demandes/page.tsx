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
  const convs = convsAll.filter((c) => c.role === "prestataire");

  return (
    <ProDevisTabs
      convs={convs}
      quotes={quotes}
      initialTab={searchParams.tab === "devis" ? "devis" : "demandes"}
    />
  );
}
