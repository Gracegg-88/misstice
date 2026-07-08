import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DevisDocument from "@/components/devis/DevisDocument";
import DevisActions, { type AutoAdd } from "@/components/devis/DevisActions";
import { getQuote } from "@/lib/pro";
import { getConversation } from "@/lib/messaging";
import { getCurrentEvent } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function DevisPage({
  params,
}: {
  params: { id: string };
}) {
  const quote = await getQuote(params.id);

  if (!quote) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream px-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold text-plum">
            Devis introuvable
          </h1>
          <p className="mt-2 text-sm text-slate">
            Ce devis n&apos;existe pas ou vous n&apos;y avez pas accès.
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-block rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            Se connecter
          </Link>
        </div>
      </main>
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPrestataire = user?.id === quote.prestataire_id;
  const contactHref = quote.conversation_id
    ? isPrestataire
      ? `/pro/messagerie/${quote.conversation_id}`
      : `/dashboard/messages/${quote.conversation_id}`
    : null;

  // Côté client : à l'acceptation, on rattache le prestataire à son événement
  // courant (event_vendors). On prépare ici les infos nécessaires.
  let autoAdd: AutoAdd = null;
  if (!isPrestataire && quote.conversation_id) {
    const [res, event] = await Promise.all([
      getConversation(quote.conversation_id),
      getCurrentEvent(),
    ]);
    const vendorId = res?.conv.vendor_id ?? null;
    if (vendorId && event) {
      autoAdd = {
        eventId: event.id,
        vendorId,
        name: quote.presta_name || res?.conv.vendor_name || "Prestataire",
        category: quote.presta_category,
        price: quote.amount,
      };
    }
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-8 sm:px-6">
      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <Link
          href={isPrestataire ? "/pro/demandes?tab=devis" : "/dashboard/messages"}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-plum"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>
      </div>

      <DevisDocument quote={quote} />

      <div className="mt-8">
        <DevisActions
          quoteId={quote.id}
          conversationId={quote.conversation_id}
          contactHref={contactHref}
          canRespond={!isPrestataire && !!quote.conversation_id}
          status={quote.status}
          autoAdd={autoAdd}
        />
      </div>
    </main>
  );
}
