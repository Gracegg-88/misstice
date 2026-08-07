import { CalendarDays, Wallet, MapPin, Users, Store, Lock } from "lucide-react";
import type { ProjectContext } from "@/lib/messaging-types";


function fmtDate(iso: string | null) {
  if (!iso) return "À définir";
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function euro(n: number) {
  return `${n.toLocaleString("fr-FR")} €`;
}

/** Aperçu du projet client — visible côté prestataire dans une conversation.
 * Lieu / invités / prestataires déjà réservés n'apparaissent qu'une fois un
 * devis accepté (voir lib/messaging.ts → getProjectContext). */
export default function ProjectContextCard({
  context,
}: {
  context: ProjectContext;
}) {
  return (
    <div className="mx-5 mt-4 rounded-2xl border border-black/5 bg-cream px-4 py-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">
        {context.eventName || "Projet du client"}
      </p>
      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
        <span className="flex items-center gap-1.5 text-plum">
          <CalendarDays size={14} className="shrink-0 text-violet" />
          {fmtDate(context.eventDate)}
        </span>
        <span className="flex items-center gap-1.5 text-plum">
          <Wallet size={14} className="shrink-0 text-violet" />
          Budget {euro(context.budgetTotal)}
        </span>
        {context.accepted ? (
          <>
            <span className="flex items-center gap-1.5 text-plum">
              <MapPin size={14} className="shrink-0 text-violet" />
              {context.location || "Lieu à définir"}
            </span>
            <span className="flex items-center gap-1.5 text-plum">
              <Users size={14} className="shrink-0 text-violet" />
              {context.guestCount ?? 0} invités
            </span>
            <span className="flex items-center gap-1.5 text-plum">
              <Store size={14} className="shrink-0 text-violet" />
              {context.bookedVendorsCount} prestataire
              {context.bookedVendorsCount > 1 ? "s" : ""} réservé
              {context.bookedVendorsCount > 1 ? "s" : ""}
            </span>
          </>
        ) : (
          <span className="col-span-2 flex items-center gap-1.5 text-slate sm:col-span-1">
            <Lock size={13} className="shrink-0" />
            Lieu, invités et prestataires réservés visibles après acceptation
          </span>
        )}
      </div>
    </div>
  );
}
