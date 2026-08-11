import { FileText } from "lucide-react";
import { getAdminQuotes } from "@/lib/pro";
import { euro } from "@/lib/quote-doc";
import DisputesPanel from "@/components/admin/DisputesPanel";
import type { Quote } from "@/lib/pro-types";

const STATUS_STYLE: Record<Quote["status"], string> = {
  envoyé: "bg-violet-soft text-violet",
  accepté: "bg-emerald-soft text-emerald",
  refusé: "bg-black/5 text-slate",
  expiré: "bg-cream text-slate",
  annulé: "bg-black/5 text-slate",
  "en litige": "bg-festif-soft text-festif",
  payé: "bg-emerald-soft text-emerald",
  "en attente de confirmation": "bg-emerald-soft text-emerald",
  "en attente de réalisation": "bg-emerald-soft text-emerald",
  "fonds libérés": "bg-emerald-soft text-emerald",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default async function AdminDevisPage() {
  const quotes = await getAdminQuotes();
  const disputed = quotes.filter((q) => q.status === "en litige");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Devis
      </h1>
      <p className="mt-1 text-sm text-slate">
        {quotes.length} devis au total
        {disputed.length > 0 && (
          <span className="ml-2 font-semibold text-festif">
            · {disputed.length} en litige
          </span>
        )}
      </p>

      {disputed.length > 0 && <DisputesPanel disputed={disputed} />}

      <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white">
        <ul className="divide-y divide-black/5">
          {quotes.map((q) => (
            <li
              key={q.id}
              className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
                q.status === "en litige" ? "bg-festif-soft/40" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-medium text-plum">
                  <FileText size={14} className="shrink-0 text-slate" />
                  {q.client_name || "Client"} × {q.presta_name || "Prestataire"}
                </p>
                <p className="text-xs text-slate">
                  {q.quote_number ? `${q.quote_number} · ` : ""}
                  {q.event_label ? `${q.event_label} · ` : ""}
                  envoyé le {formatDate(q.created_at)}
                  {q.event_date ? ` · événement le ${q.event_date}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-semibold text-plum">
                  {euro(q.amount)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[q.status]}`}
                >
                  {q.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {quotes.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate">
            Aucun devis pour l&apos;instant.
          </p>
        )}
      </div>
    </div>
  );
}
