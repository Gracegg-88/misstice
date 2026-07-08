import { redirect } from "next/navigation";
import DevisForm from "@/components/pro/DevisForm";
import { getConversation } from "@/lib/messaging";
import { getMyVendor } from "@/lib/pro";
import { createClient } from "@/lib/supabase/server";

export default async function NouveauDevisPage({
  searchParams,
}: {
  searchParams: { conv?: string };
}) {
  const convId = searchParams.conv;
  if (!convId) redirect("/pro/demandes");

  const [result, vendor] = await Promise.all([
    getConversation(convId),
    getMyVendor(),
  ]);

  // Doit être une conversation dont le prestataire connecté est propriétaire.
  if (!result || result.conv.role !== "prestataire") redirect("/pro/demandes");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <DevisForm
      conversationId={result.conv.id}
      prestataireId={result.userId}
      clientName={result.conv.otherName}
      eventLabel={result.conv.subject}
      prestaName={vendor?.company ?? "Prestataire"}
      prestaCategory={vendor?.category ?? null}
      prestaEmail={user?.email ?? ""}
      demande={result.conv.demande}
    />
  );
}
