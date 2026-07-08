import {
  FileText,
  CalendarDays,
  MapPin,
  Users,
  User,
  Briefcase,
  Mail,
  Phone,
  Quote as QuoteIcon,
  CheckCircle2,
  Info,
  Globe,
} from "lucide-react";
import type { Quote } from "@/lib/pro-types";
import { euro, quoteTotals } from "@/lib/quote-doc";
import { categoryUsesGuests } from "@/lib/quote-fields";

const STATUS_LABEL: Record<Quote["status"], string> = {
  envoyé: "En attente",
  accepté: "Accepté",
  refusé: "Refusé",
  expiré: "Expiré",
};

const STATUS_STYLE: Record<Quote["status"], string> = {
  envoyé: "bg-festif-soft text-festif",
  accepté: "bg-emerald-soft text-emerald",
  refusé: "bg-black/10 text-slate",
  expiré: "bg-black/10 text-slate",
};

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate">{label}</p>
        <p className="truncate text-sm font-semibold text-plum">{value}</p>
      </div>
    </div>
  );
}

function ContactLine({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 text-sm text-slate">
      <Icon size={15} className="shrink-0 text-violet" />
      <span className="truncate">{children}</span>
    </p>
  );
}

/** La fiche devis, façon document — utilisée en aperçu et sur la page publique. */
export default function DevisDocument({ quote }: { quote: Quote }) {
  const t = quoteTotals(quote.items, quote.service_fee, quote.tax_rate);
  const dash = "À définir";
  const showGuests = categoryUsesGuests(quote.presta_category);

  return (
    <div className="devis-sheet mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
      {/* En-tête */}
      <div className="relative bg-violet-soft/40 px-8 pb-6 pt-8 sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-display text-3xl font-semibold text-violet">
              Misstice
            </p>
            <p className="mt-1 max-w-[16rem] text-sm text-slate">
              On transforme le stress de l&apos;organisation en plaisir.
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-plum">
                DEVIS
              </h1>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet ring-1 ring-black/5">
                <FileText size={22} />
              </span>
            </div>
            <p className="text-sm font-medium text-violet">
              Proposition de prestation
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-x-8 gap-y-1.5 text-sm sm:max-w-sm sm:justify-self-end">
          <Meta label="Devis n°" value={quote.quote_number || "—"} accent />
          <Meta label="Date d'émission" value={fmtDate(quote.created_at)} />
          <Meta
            label="Validité du devis"
            value={`${quote.validity_days} jours`}
          />
          <div className="grid grid-cols-[9rem_1fr] items-center gap-2">
            <span className="text-slate">Statut</span>
            <span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[quote.status]}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {STATUS_LABEL[quote.status]}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 sm:px-10">
        {/* Bande Besoin / Événement (le « nombre d'invités » dépend du métier) */}
        <div
          className={`grid gap-5 rounded-2xl bg-cream px-6 py-5 ${
            showGuests ? "sm:grid-cols-4" : "sm:grid-cols-3"
          }`}
        >
          <Field
            icon={CalendarDays}
            label="Besoin / Événement"
            value={quote.event_need || "À définir selon votre projet"}
          />
          <Field icon={CalendarDays} label="Date" value={quote.event_date || dash} />
          <Field icon={MapPin} label="Lieu" value={quote.event_location || dash} />
          {showGuests && (
            <Field
              icon={Users}
              label="Nombre d'invités"
              value={quote.guests_count || dash}
            />
          )}
        </div>

        {/* Client / Prestataire */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <PartyCard
            icon={User}
            role="Client"
            name={quote.client_name || "Client"}
            lines={[
              { icon: Mail, value: quote.client_email },
              { icon: Phone, value: quote.client_phone },
              { icon: MapPin, value: quote.client_address },
            ]}
          />
          <PartyCard
            icon={Briefcase}
            role="Prestataire"
            name={quote.presta_name || "Prestataire"}
            subtitle={quote.presta_category}
            lines={[
              { icon: Mail, value: quote.presta_email },
              { icon: Phone, value: quote.presta_phone },
              { icon: MapPin, value: quote.presta_address },
            ]}
          />
        </div>

        {/* Message d'intro */}
        {quote.intro_message?.trim() && (
          <div className="mt-6 flex gap-4 rounded-2xl bg-festif-soft/50 px-6 py-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-festif-soft text-festif">
              <QuoteIcon size={20} />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-violet">
                Bonjour,
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate">
                {quote.intro_message.trim()}
              </p>
            </div>
          </div>
        )}

        {/* Détail des prestations */}
        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-violet">
          Détail des prestations
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-xs font-semibold text-slate">
                <th className="py-2 pr-2 font-semibold">#</th>
                <th className="py-2 pr-3 font-semibold">Prestation</th>
                <th className="py-2 pr-3 font-semibold">Description</th>
                <th className="py-2 pr-3 text-center font-semibold">Qté</th>
                <th className="py-2 pr-3 text-right font-semibold">Prix unitaire</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate">
                    Aucune prestation détaillée.
                  </td>
                </tr>
              )}
              {quote.items.map((it, i) => {
                const line = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
                return (
                  <tr key={i} className="border-b border-black/5 align-top">
                    <td className="py-3 pr-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-soft text-xs font-semibold text-violet">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </td>
                    <td className="py-3 pr-3 font-medium text-plum">
                      {it.label || "—"}
                    </td>
                    <td className="py-3 pr-3 text-slate">{it.description}</td>
                    <td className="py-3 pr-3 text-center text-slate">
                      {Number(it.qty) || 0}
                    </td>
                    <td className="py-3 pr-3 text-right text-slate">
                      {euro(Number(it.unit_price) || 0)}
                    </td>
                    <td className="py-3 text-right font-semibold text-violet">
                      {euro(line)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Conditions + Récapitulatif */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-violet">
              Conditions &amp; informations
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate">
              {[
                `Ce devis est valable ${quote.validity_days} jours à compter de sa date d'émission.`,
                "La réservation est confirmée après validation du devis et accord du prestataire.",
                "Les détails peuvent être ajustés selon vos besoins spécifiques.",
                "Le paiement s'effectue selon les modalités convenues avec le prestataire.",
              ].map((c) => (
                <li key={c} className="flex items-start gap-2">
                  <CheckCircle2
                    size={16}
                    className="mt-0.5 shrink-0 text-violet"
                  />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-3 flex items-center gap-2 rounded-xl bg-violet-soft px-3 py-2 text-sm font-semibold text-violet">
              <Info size={15} />
              Devis gratuit et sans engagement.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-soft/50 px-6 py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-violet">
              Récapitulatif
            </h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Sous-total" value={euro(t.subtotal)} />
              <Row label="Frais de service" value={euro(t.fee)} />
              <Row
                label={`TVA (${quote.tax_rate || 0}%)`}
                value={euro(t.tax)}
              />
            </dl>
            <div className="mt-4 border-t border-violet/20 pt-4">
              <div className="flex items-end justify-between">
                <span className="text-sm font-semibold uppercase tracking-wide text-violet">
                  Total estimé
                </span>
                <span className="font-display text-3xl font-semibold text-violet">
                  {euro(t.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pied de page */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-black/5 bg-cream px-8 py-5 text-sm text-slate">
        <span className="flex items-center gap-1.5 font-display font-semibold text-violet">
          <span className="text-festif">✦</span> Misstice
        </span>
        {quote.presta_phone && (
          <ContactLine icon={Phone}>{quote.presta_phone}</ContactLine>
        )}
        <ContactLine icon={Mail}>contact@misstice.com</ContactLine>
        <ContactLine icon={Globe}>www.misstice.com</ContactLine>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="grid grid-cols-[9rem_1fr] items-center gap-2">
      <span className="text-slate">{label}</span>
      <span className={accent ? "font-semibold text-violet" : "text-plum"}>
        {value}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-slate">{label}</dt>
      <dd className="font-medium text-plum">{value}</dd>
    </div>
  );
}

function PartyCard({
  icon: Icon,
  role,
  name,
  subtitle,
  lines,
}: {
  icon: React.ElementType;
  role: string;
  name: string;
  subtitle?: string | null;
  lines: { icon: React.ElementType; value: string | null }[];
}) {
  return (
    <div className="rounded-2xl border border-black/5 bg-cream/60 px-6 py-5">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-soft text-violet">
          <Icon size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-violet">{role}</p>
          <p className="truncate font-display text-lg font-semibold text-plum">
            {name}
          </p>
        </div>
      </div>
      {subtitle && <p className="mt-2 text-sm text-slate">{subtitle}</p>}
      <div className="mt-3 space-y-1.5">
        {lines.map((l, i) => (
          <ContactLine key={i} icon={l.icon}>
            {l.value || "À définir"}
          </ContactLine>
        ))}
      </div>
    </div>
  );
}
