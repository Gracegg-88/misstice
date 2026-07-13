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

type QuoteStatus = "envoyé" | "accepté" | "refusé" | "expiré";

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

  const respond = async (next: "accepté" | "refusé") => {
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

    setSaving(false);
    setCurrent(next);
    // Rafraîchit les composants serveur (badge du devis, listes) qui sinon
    // resteraient figés sur l'ancien statut.
    router.refresh();
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
              onClick={() => respond("accepté")}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Valider le devis
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

        {current === "accepté" && (
          <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-soft px-6 py-3 text-sm font-semibold text-emerald">
            <CheckCircle2 size={16} />
            Devis validé
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
