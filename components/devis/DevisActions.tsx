"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Download,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type QuoteStatus =
  | "envoyé"
  | "accepté"
  | "refusé"
  | "expiré"
  | "annulé"
  | "en litige"
  | "payé"
  | "en attente de confirmation"
  | "en attente de réalisation"
  | "fonds libérés";

export type AutoAdd = {
  eventId: string;
  vendorId: string;
  name: string;
  category: string | null;
  price: number;
} | null;

export default function DevisActions({
  quoteId,
  conversationId,
  contactHref,
  canRespond,
  status,
  autoAdd,
}: {
  quoteId: string;
  conversationId: string | null;
  contactHref: string | null;
  canRespond: boolean;
  status: QuoteStatus;
  autoAdd?: AutoAdd;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<QuoteStatus>(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Effets de bord communs aux deux issues (accepté via paiement, refusé via
  // RPC directe) : synchronise la demande côté prestataire et la fiche
  // event_vendors/budget côté famille. Appelé une fois le nouveau statut
  // confirmé côté serveur.
  const applySideEffects = async (
    supabase: ReturnType<typeof createClient>,
    next: "accepté" | "refusé"
  ) => {
    // Synchronise le statut de la demande (vue « Demandes » côté prestataire).
    if (conversationId) {
      await supabase
        .from("conversations")
        .update({ status: next === "accepté" ? "Acceptée" : "Refusée" })
        .eq("id", conversationId);
    }

    // Le statut du prestataire sur l'événement suit ses devis (agrégat) :
    //  • accepté  → « confirmé » (on fait toujours monter, jamais redescendre),
    //  • refusé   → « refusé » UNIQUEMENT s'il n'est pas déjà « confirmé »
    //    (un autre devis refusé ne dé-emploie pas un prestataire confirmé).
    if (autoAdd) {
      const { data: existing } = await supabase
        .from("event_vendors")
        .select("id, status")
        .eq("event_id", autoAdd.eventId)
        .eq("vendor_id", autoAdd.vendorId)
        .maybeSingle();
      const ex = existing as { id: string; status: string } | null;

      if (next === "accepté") {
        if (ex) {
          await supabase
            .from("event_vendors")
            .update({ status: "confirmé", price: autoAdd.price })
            .eq("id", ex.id);
        } else {
          await supabase.from("event_vendors").insert({
            event_id: autoAdd.eventId,
            vendor_id: autoAdd.vendorId,
            name: autoAdd.name,
            category: autoAdd.category,
            status: "confirmé",
            price: autoAdd.price,
          });
        }

        // Budget : ajoute automatiquement une dépense correspondant à ce
        // devis, dans la catégorie du prestataire (créée si besoin, ou
        // catégorie générique de repli). quote_id évite tout doublon si
        // cette action se déclenche deux fois pour le même devis.
        const { data: alreadyAdded } = await supabase
          .from("budget_expenses")
          .select("id")
          .eq("quote_id", quoteId)
          .maybeSingle();

        if (!alreadyAdded) {
          let categoryId: string | null = null;
          if (autoAdd.category) {
            const { data: catMatch } = await supabase
              .from("budget_categories")
              .select("id")
              .eq("event_id", autoAdd.eventId)
              .ilike("name", autoAdd.category)
              .maybeSingle();
            categoryId = (catMatch as { id: string } | null)?.id ?? null;
          }
          if (!categoryId) {
            const { data: fallback } = await supabase
              .from("budget_categories")
              .select("id")
              .eq("event_id", autoAdd.eventId)
              .ilike("name", "Divers")
              .maybeSingle();
            categoryId = (fallback as { id: string } | null)?.id ?? null;
          }
          if (categoryId) {
            await supabase.from("budget_expenses").insert({
              category_id: categoryId,
              event_id: autoAdd.eventId,
              label: autoAdd.name,
              amount: autoAdd.price,
              quote_id: quoteId,
            });
          }
        }
      } else {
        // refusé
        if (ex) {
          if (ex.status !== "confirmé") {
            await supabase
              .from("event_vendors")
              .update({ status: "refusé" })
              .eq("id", ex.id);
          }
        } else {
          await supabase.from("event_vendors").insert({
            event_id: autoAdd.eventId,
            vendor_id: autoAdd.vendorId,
            name: autoAdd.name,
            category: autoAdd.category,
            status: "refusé",
            price: autoAdd.price,
          });
        }
      }
    }
  };

  const respond = async (next: "refusé") => {
    if (saving) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    // La famille ne modifie pas la table quotes en direct (RLS) : elle passe par
    // une RPC qui n'écrit QUE le statut (anti-falsification du montant — CRIT-1).
    const { data: ok, error: upErr } = await supabase.rpc("set_quote_status", {
      p_quote: quoteId,
      p_status: next,
    });
    if (upErr || ok === false) {
      setSaving(false);
      setError(upErr?.message ?? "Action impossible sur ce devis.");
      return;
    }
    await applySideEffects(supabase, next);
    setSaving(false);
    setCurrent(next);
    // Rafraîchit les composants serveur (badge du devis, listes) qui sinon
    // resteraient figés sur l'ancien statut.
    router.refresh();
  };

  // Accepter un devis déclenche immédiatement le paiement sécurisé (séquestre
  // Misstice) : contrairement au refus, ça ne s'arrête pas à un changement de
  // statut, direction Stripe pour finaliser.
  const acceptAndPay = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Impossible d'accepter ce devis.");
      }
      const supabase = createClient();
      await applySideEffects(supabase, "accepté");
      window.location.href = data.url as string;
    } catch (e) {
      setSaving(false);
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
  };

  // Après la rencontre/essai préalable (traiteur, robe/tenue, coiffure-
  // maquillage), la famille confirme (le séquestre suit son cours normal)
  // ou annule (remboursement des 85 % au client, commission conservée —
  // fait côté Stripe avant d'enregistrer le résultat).
  const decideTrial = async (confirmed: boolean) => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/trial/decide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quoteId, confirmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Action impossible sur ce devis.");
      }
      if (!confirmed) {
        const supabase = createClient();
        // Contrairement à applySideEffects("refusé") — qui protège un
        // prestataire déjà « confirmé » d'être redescendu par le refus d'un
        // AUTRE devis — ici c'est ce même devis, déjà confirmé après
        // paiement, qui est annulé : la rétrogradation doit être inconditionnelle.
        if (conversationId) {
          await supabase
            .from("conversations")
            .update({ status: "Refusée" })
            .eq("id", conversationId);
        }
        if (autoAdd) {
          await supabase
            .from("event_vendors")
            .update({ status: "refusé" })
            .eq("event_id", autoAdd.eventId)
            .eq("vendor_id", autoAdd.vendorId);
        }
        await supabase.from("budget_expenses").delete().eq("quote_id", quoteId);
      }
      setCurrent(data.status as QuoteStatus);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  // Le client ne peut répondre qu'à un devis encore en attente.
  const pending = canRespond && current === "envoyé";

  return (
    <div className="no-print">
      {error && <p className="mb-3 text-center text-sm text-festif">{error}</p>}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-plum hover:bg-cream"
        >
          <Download size={16} />
          Télécharger le devis
        </button>

        {pending && (
          <>
            <button
              type="button"
              onClick={acceptAndPay}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Accepter et payer
            </button>
            <button
              type="button"
              onClick={() => respond("refusé")}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-festif/40 bg-white px-5 py-3 text-sm font-semibold text-festif hover:bg-festif-soft disabled:opacity-60"
            >
              <XCircle size={16} />
              Refuser
            </button>
          </>
        )}

        {/* Accepté mais pas encore payé (paiement Stripe abandonné ou pas
            encore terminé) : on propose de reprendre le paiement. */}
        {current === "accepté" && (
          <button
            type="button"
            onClick={acceptAndPay}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            Reprendre le paiement
          </button>
        )}
        {current === "payé" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-soft px-6 py-3 text-sm font-semibold text-emerald">
            <CheckCircle2 size={16} />
            Paiement sécurisé reçu
          </span>
        )}
        {current === "en attente de confirmation" && (
          <>
            <button
              type="button"
              onClick={() => decideTrial(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Confirmer après rencontre
            </button>
            <button
              type="button"
              onClick={() => decideTrial(false)}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl border border-festif/40 bg-white px-5 py-3 text-sm font-semibold text-festif hover:bg-festif-soft disabled:opacity-60"
            >
              <XCircle size={16} />
              Annuler après rencontre
            </button>
          </>
        )}
        {current === "en attente de réalisation" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-soft px-6 py-3 text-sm font-semibold text-emerald">
            <CheckCircle2 size={16} />
            Réservation confirmée, paiement sécurisé
          </span>
        )}
        {current === "fonds libérés" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-soft px-6 py-3 text-sm font-semibold text-emerald">
            <CheckCircle2 size={16} />
            Prestation terminée
          </span>
        )}
        {current === "refusé" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-black/5 px-6 py-3 text-sm font-semibold text-slate">
            <XCircle size={16} />
            Devis refusé
          </span>
        )}
        {current === "expiré" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-festif-soft px-6 py-3 text-sm font-semibold text-festif">
            Devis expiré
          </span>
        )}
        {current === "annulé" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-black/5 px-6 py-3 text-sm font-semibold text-slate">
            <XCircle size={16} />
            Devis annulé
          </span>
        )}
        {current === "en litige" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-festif-soft px-6 py-3 text-sm font-semibold text-festif">
            En litige
          </span>
        )}

        {contactHref && (
          <Link
            href={contactHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-plum hover:bg-cream"
          >
            <MessageSquare size={16} />
            Contacter le prestataire
          </Link>
        )}
      </div>
    </div>
  );
}
