"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Send, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { QuoteItem } from "@/lib/pro-types";
import type { DemandeDetails } from "@/lib/messaging-types";
import { euro, quoteTotals } from "@/lib/quote-doc";
import { categoryUsesGuests } from "@/lib/quote-fields";

type Props = {
  // null → mode BROUILLON : le prestataire rédige sans demande et choisit le
  // client destinataire à l'envoi (via `conversations`).
  conversationId: string | null;
  prestataireId: string;
  clientName?: string;
  eventLabel: string | null;
  prestaName: string;
  prestaCategory: string | null;
  prestaEmail: string;
  demande: DemandeDetails | null;
  // Conversations du prestataire (pour choisir le destinataire en brouillon).
  conversations?: { id: string; clientName: string }[];
};

const emptyItem = (): QuoteItem => ({
  label: "",
  description: "",
  qty: 1,
  unit_price: 0,
});

const DEFAULT_INTRO =
  "Merci pour votre confiance. Vous trouverez ci-dessous notre proposition détaillée adaptée à votre besoin. N'hésitez pas à nous contacter pour toute question.";

export default function DevisForm({
  conversationId,
  prestataireId,
  clientName = "",
  eventLabel,
  prestaName,
  prestaCategory,
  prestaEmail,
  demande,
  conversations = [],
}: Props) {
  const router = useRouter();
  const draft = !conversationId;
  // Destinataire choisi en mode brouillon.
  const [pickedConv, setPickedConv] = useState("");

  const [eventNeed, setEventNeed] = useState(
    demande?.event_need || eventLabel || ""
  );
  const [eventDate, setEventDate] = useState(demande?.event_date || "");
  const [eventLocation, setEventLocation] = useState(
    demande?.event_location || ""
  );
  const [guests, setGuests] = useState(demande?.guests_count || "");

  const [clientEmail, setClientEmail] = useState(demande?.client_email || "");
  const [clientPhone, setClientPhone] = useState(demande?.client_phone || "");
  const [clientAddress, setClientAddress] = useState(
    demande?.client_address || ""
  );

  const [prestaPhone, setPrestaPhone] = useState("");
  const [prestaAddress, setPrestaAddress] = useState("");

  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [validity, setValidity] = useState(15);
  const [serviceFee, setServiceFee] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  // Prestations pré-remplies par la demande du client (prix à compléter).
  const [items, setItems] = useState<QuoteItem[]>(
    demande?.items && demande.items.length
      ? demande.items.map((it) => ({
          label: it.label,
          description: it.description,
          qty: it.qty,
          unit_price: 0,
        }))
      : [emptyItem()]
  );

  const showGuests = categoryUsesGuests(prestaCategory);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totals = useMemo(
    () => quoteTotals(items, serviceFee, taxRate),
    [items, serviceFee, taxRate]
  );

  const updateItem = (i: number, patch: Partial<QuoteItem>) =>
    setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const submit = async () => {
    if (saving) return;
    const clean = items.filter((it) => it.label.trim());
    if (clean.length === 0) {
      setError("Ajoutez au moins une prestation.");
      return;
    }
    // Destinataire : conversation reçue en prop, ou choisie en brouillon.
    const targetConvId = conversationId || pickedConv;
    if (!targetConvId) {
      setError("Choisissez le client destinataire du devis.");
      return;
    }
    const targetClientName =
      clientName ||
      conversations.find((c) => c.id === targetConvId)?.clientName ||
      "Client";
    setSaving(true);
    setError("");
    const supabase = createClient();

    // Champs communs du devis (le numéro est ajouté à chaque tentative).
    const basePayload = {
      prestataire_id: prestataireId,
      conversation_id: targetConvId,
      client_name: targetClientName,
      event_label: eventNeed.trim() || eventLabel,
      amount: totals.total,
      status: "envoyé",
      validity_days: validity,
      intro_message: intro.trim() || null,
      event_need: eventNeed.trim() || null,
      event_date: eventDate.trim() || null,
      event_location: eventLocation.trim() || null,
      guests_count: showGuests ? guests.trim() || null : null,
      client_email: clientEmail.trim() || null,
      client_phone: clientPhone.trim() || null,
      client_address: clientAddress.trim() || null,
      service_fee: serviceFee,
      tax_rate: taxRate,
      items: clean,
      presta_name: prestaName,
      presta_category: prestaCategory,
      presta_email: prestaEmail || null,
      presta_phone: prestaPhone.trim() || null,
      presta_address: prestaAddress.trim() || null,
    };

    // Numéro de devis unique via séquence Postgres. En cas de collision
    // (23505 sur quotes_quote_number_key), on régénère et on réessaie.
    let data: { id: string } | null = null;
    let insErr: { code?: string; message?: string } | null = null;
    let quoteNumber = "";
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data: numData } = await supabase.rpc("next_quote_number");
      quoteNumber =
        (numData as string | null) ??
        `DEV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const res = await supabase
        .from("quotes")
        .insert({ ...basePayload, quote_number: quoteNumber })
        .select("id")
        .single();
      data = res.data as { id: string } | null;
      insErr = res.error;
      if (!insErr) break;
      // On ne réessaie que sur un doublon de numéro ; sinon on abandonne.
      if (insErr.code !== "23505") break;
    }

    if (insErr || !data) {
      setSaving(false);
      setError(insErr?.message ?? "Impossible d'enregistrer le devis.");
      return;
    }

    // Message dans la conversation → la famille voit le devis (carte cliquable).
    // On vérifie l'insert : sans ce message, le devis serait « fantôme » côté client.
    const { error: msgErr } = await supabase.from("messages").insert({
      conversation_id: targetConvId,
      sender_id: prestataireId,
      body: `[[devis:${data.id}]] Devis ${quoteNumber} — ${euro(totals.total)}`,
    });
    if (msgErr) {
      console.error("devis message insert:", msgErr);
    }

    router.push(`/devis/${data.id}`);
  };

  return (
    <div className="mx-auto max-w-3xl pb-24">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate hover:text-plum"
      >
        <ArrowLeft size={16} />
        Retour
      </button>

      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-plum">
        Nouveau devis
      </h1>
      <p className="mt-1 text-sm text-slate">
        {draft ? (
          <>Rédigez votre devis, puis choisissez le client destinataire à l&apos;envoi.</>
        ) : (
          <>
            Pour <span className="font-semibold text-plum">{clientName}</span> —
            cette fiche sera envoyée au client, qui pourra la télécharger.
          </>
        )}
      </p>

      {/* Besoin / Événement */}
      <Section title="Besoin & événement">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Besoin / Événement" value={eventNeed} onChange={setEventNeed} placeholder="ex. Maquillage mariage" />
          <Input label="Date" type="date" value={eventDate} onChange={setEventDate} />
          <Input label="Lieu" value={eventLocation} onChange={setEventLocation} placeholder="ex. Paris 11e" />
          {showGuests && (
            <Input label="Nombre d'invités" value={guests} onChange={setGuests} placeholder="ex. 80" />
          )}
        </div>
      </Section>

      {/* Coordonnées client */}
      <Section title="Coordonnées du client">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Email" value={clientEmail} onChange={setClientEmail} placeholder="email@exemple.com" />
          <Input label="Téléphone" value={clientPhone} onChange={setClientPhone} placeholder="06 XX XX XX XX" />
          <Input label="Adresse" value={clientAddress} onChange={setClientAddress} placeholder="Adresse du client" />
        </div>
      </Section>

      {/* Mes coordonnées */}
      <Section title="Mes coordonnées (affichées sur le devis)">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Email" value={prestaEmail} onChange={() => {}} disabled />
          <Input label="Téléphone" value={prestaPhone} onChange={setPrestaPhone} placeholder="06 XX XX XX XX" />
          <Input label="Adresse" value={prestaAddress} onChange={setPrestaAddress} placeholder="Votre adresse / zone" />
        </div>
      </Section>

      {/* Message */}
      <Section title="Message d'introduction">
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
        />
      </Section>

      {/* Prestations */}
      <Section title="Détail des prestations">
        <div className="space-y-3">
          {items.map((it, i) => {
            const line = (Number(it.qty) || 0) * (Number(it.unit_price) || 0);
            return (
              <div
                key={i}
                className="rounded-2xl border border-black/5 bg-cream/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet">
                    Prestation {String(i + 1).padStart(2, "0")}
                  </span>
                  <button
                    onClick={() =>
                      setItems((l) => (l.length > 1 ? l.filter((_, j) => j !== i) : l))
                    }
                    disabled={items.length === 1}
                    aria-label="Supprimer la ligne"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate hover:bg-festif-soft hover:text-festif disabled:opacity-30"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={it.label}
                    onChange={(e) => updateItem(i, { label: e.target.value })}
                    placeholder="Intitulé de la prestation"
                    className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm outline-none focus:border-violet sm:col-span-2"
                  />
                  <input
                    value={it.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    placeholder="Description (facultatif)"
                    className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-sm outline-none focus:border-violet sm:col-span-2"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate">
                    Quantité
                    <input
                      type="number"
                      min={0}
                      value={it.qty}
                      onChange={(e) =>
                        updateItem(i, {
                          qty: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-violet"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate">
                    Prix unitaire (€)
                    <input
                      type="number"
                      min={0}
                      value={it.unit_price}
                      onChange={(e) =>
                        updateItem(i, {
                          unit_price: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-28 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-violet"
                    />
                  </label>
                </div>
                <p className="mt-2 text-right text-sm text-slate">
                  Total ligne :{" "}
                  <span className="font-semibold text-violet">{euro(line)}</span>
                </p>
              </div>
            );
          })}
          <button
            onClick={() => setItems((l) => [...l, emptyItem()])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-violet/40 px-4 py-2 text-sm font-semibold text-violet hover:bg-violet-soft"
          >
            <Plus size={15} />
            Ajouter une prestation
          </button>
        </div>
      </Section>

      {/* Récapitulatif */}
      <Section title="Récapitulatif">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="text-sm text-slate">
            Validité (jours)
            <input
              type="number"
              min={1}
              value={validity}
              onChange={(e) =>
                setValidity(Math.min(365, Math.max(1, Number(e.target.value) || 1)))
              }
              className="mt-1 w-full rounded-xl border border-black/10 bg-cream px-3.5 py-2 text-sm text-plum outline-none focus:border-violet"
            />
          </label>
          <label className="text-sm text-slate">
            Frais de service (€)
            <input
              type="number"
              min={0}
              value={serviceFee}
              onChange={(e) => setServiceFee(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-xl border border-black/10 bg-cream px-3.5 py-2 text-sm text-plum outline-none focus:border-violet"
            />
          </label>
          <label className="text-sm text-slate">
            TVA (%)
            <input
              type="number"
              min={0}
              value={taxRate}
              onChange={(e) =>
                setTaxRate(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
              }
              className="mt-1 w-full rounded-xl border border-black/10 bg-cream px-3.5 py-2 text-sm text-plum outline-none focus:border-violet"
            />
          </label>
        </div>
        <dl className="mt-4 space-y-1.5 rounded-2xl bg-violet-soft/50 px-5 py-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate">Sous-total</dt>
            <dd className="font-medium text-plum">{euro(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate">Frais de service</dt>
            <dd className="font-medium text-plum">{euro(totals.fee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate">TVA ({taxRate || 0}%)</dt>
            <dd className="font-medium text-plum">{euro(totals.tax)}</dd>
          </div>
          <div className="mt-2 flex items-end justify-between border-t border-violet/20 pt-3">
            <dt className="font-semibold uppercase tracking-wide text-violet">
              Total estimé
            </dt>
            <dd className="font-display text-2xl font-semibold text-violet">
              {euro(totals.total)}
            </dd>
          </div>
        </dl>
      </Section>

      {/* Brouillon : choisir le client destinataire à l'envoi. */}
      {draft && (
        <Section title="Envoyer à">
          {conversations.length === 0 ? (
            <p className="text-sm text-slate">
              Aucune conversation pour l&apos;instant. Un client doit d&apos;abord
              vous écrire (message ou demande de devis) pour pouvoir lui envoyer
              un devis.
            </p>
          ) : (
            <label className="text-sm text-slate">
              Client destinataire
              <select
                value={pickedConv}
                onChange={(e) => setPickedConv(e.target.value)}
                className="mt-1 w-full rounded-xl border border-black/10 bg-cream px-3.5 py-2 text-sm text-plum outline-none focus:border-violet"
              >
                <option value="">Choisir un client…</option>
                {conversations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.clientName}
                  </option>
                ))}
              </select>
            </label>
          )}
        </Section>
      )}

      {error && <p className="mt-4 text-sm text-festif">{error}</p>}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={saving || (draft && !pickedConv)}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
        >
          <Send size={16} />
          {saving ? "Envoi…" : "Envoyer le devis"}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-violet">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <label className="text-sm text-slate">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="mt-1 w-full rounded-xl border border-black/10 bg-cream px-3.5 py-2 text-sm text-plum outline-none focus:border-violet disabled:opacity-60"
      />
    </label>
  );
}
