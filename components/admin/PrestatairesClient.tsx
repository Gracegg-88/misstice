"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Trash2,
  ShieldOff,
  ShieldCheck,
  ExternalLink,
  Eye,
  Sparkles,
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

type Vendor = {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  verified: boolean;
  reviewed_at: string | null;
  isDemo: boolean;
  claimStatus: "reclamee" | "non_reclamee";
  contactEmail: string | null;
  vuesFiche: number;
  tentativesContact: number;
  lastRelanceSentAt: string | null;
};

export default function PrestatairesClient({ vendors }: { vendors: Vendor[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmVendor, setConfirmVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState("");
  const [emailDraft, setEmailDraft] = useState<Record<string, string>>({});
  const [relanceSent, setRelanceSent] = useState<Record<string, boolean>>({});

  const saveContactEmail = async (v: Vendor) => {
    const value = (emailDraft[v.id] ?? v.contactEmail ?? "").trim();
    setBusy(v.id);
    setError("");
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("vendors")
      .update({ contact_email: value || null })
      .eq("id", v.id);
    setBusy(null);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    router.refresh();
  };

  const sendRelance = async (v: Vendor) => {
    setBusy(v.id);
    setError("");
    try {
      const res = await fetch("/api/admin/sirene/relance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ vendorId: v.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "L'envoi a échoué.");
      setRelanceSent((prev) => ({ ...prev, [v.id]: true }));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (v: Vendor) => {
    setBusy(v.id);
    setError("");
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("vendors")
      .update({ verified: !v.verified })
      .eq("id", v.id);
    setBusy(null);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    router.refresh();
  };

  const markReviewed = async (v: Vendor) => {
    setBusy(v.id);
    setError("");
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("vendors")
      .update({ reviewed_at: new Date().toISOString() })
      .eq("id", v.id);
    setBusy(null);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    router.refresh();
  };

  const doRemove = async () => {
    if (!confirmVendor) return;
    setBusy(confirmVendor.id);
    setError("");
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("vendors")
      .delete()
      .eq("id", confirmVendor.id);
    setBusy(null);
    setConfirmVendor(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Prestataires
      </h1>
      <p className="mt-1 text-sm text-slate">
        {vendors.length} fiche{vendors.length > 1 ? "s" : ""} prestataire.
      </p>
      {error && (
        <p className="mt-3 rounded-xl bg-festif-soft px-4 py-2 text-sm font-medium text-festif">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Catégorie</th>
                <th className="px-5 py-3 font-medium">Ville</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate">
                    Aucune fiche prestataire.
                  </td>
                </tr>
              )}
              {vendors.map((v) => (
                <Fragment key={v.id}>
                <tr className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium text-plum">{v.name}</td>
                  <td className="px-5 py-3">
                    {v.category ? (
                      <span className="rounded-md bg-festif-soft px-2 py-0.5 text-xs font-semibold text-festif">
                        {v.category}
                      </span>
                    ) : (
                      <span className="text-slate">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate">{v.city ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {v.isDemo && v.claimStatus === "reclamee" && (
                        <span className="rounded-full bg-navy-soft px-2 py-0.5 text-xs font-semibold text-navy">
                          Démo
                        </span>
                      )}
                      {v.claimStatus === "non_reclamee" && (
                        <span className="rounded-full bg-festif-soft px-2 py-0.5 text-xs font-semibold text-festif">
                          Fiche non réclamée
                        </span>
                      )}
                      {v.verified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2 py-0.5 text-xs font-semibold text-emerald">
                          <BadgeCheck size={12} />
                          Vérifié
                        </span>
                      ) : (
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs font-semibold text-slate">
                          Non vérifié
                        </span>
                      )}
                      {!v.reviewed_at && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-festif-soft px-2 py-0.5 text-xs font-semibold text-festif">
                          <Sparkles size={12} />
                          Nouveau
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/prestataires/${v.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:border-violet/40"
                      >
                        <ExternalLink size={14} />
                        Fiche
                      </a>
                      <button
                        type="button"
                        disabled={busy === v.id}
                        onClick={() => toggle(v)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:border-violet/40 disabled:opacity-60"
                      >
                        {v.verified ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                        {v.verified ? "Retirer" : "Vérifier"}
                      </button>
                      {!v.reviewed_at && (
                        <button
                          type="button"
                          disabled={busy === v.id}
                          onClick={() => markReviewed(v)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:border-violet/40 disabled:opacity-60"
                        >
                          <Eye size={14} />
                          Marquer comme relu
                        </button>
                      )}
                      <button
                        type="button"
                        aria-label={`Supprimer ${v.name}`}
                        disabled={busy === v.id}
                        onClick={() => setConfirmVendor(v)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate transition-colors hover:bg-festif-soft hover:text-festif disabled:opacity-60"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
                {v.claimStatus === "non_reclamee" && (
                  <tr className="border-b border-black/5 bg-cream/60 last:border-0">
                    <td colSpan={5} className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs text-slate">
                          {v.vuesFiche} vue{v.vuesFiche > 1 ? "s" : ""} · {v.tentativesContact} tentative
                          {v.tentativesContact > 1 ? "s" : ""} de contact
                          {v.lastRelanceSentAt && (
                            <> · dernière relance le {new Date(v.lastRelanceSentAt).toLocaleDateString("fr-FR")}</>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-slate" />
                          <input
                            type="email"
                            placeholder="email de contact"
                            defaultValue={v.contactEmail ?? ""}
                            onChange={(e) =>
                              setEmailDraft((prev) => ({ ...prev, [v.id]: e.target.value }))
                            }
                            onBlur={() => saveContactEmail(v)}
                            className="rounded-lg border border-black/10 px-2.5 py-1.5 text-xs text-plum outline-none focus:border-violet"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={busy === v.id || !v.contactEmail || v.tentativesContact < 1}
                          onClick={() => sendRelance(v)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-3 py-1.5 text-xs font-semibold text-plum transition-colors hover:border-violet/40 disabled:opacity-50"
                        >
                          {busy === v.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                          {relanceSent[v.id] ? "Relance envoyée" : "Envoyer relance"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmVendor !== null}
        loading={busy === confirmVendor?.id}
        title="Supprimer la fiche"
        message={
          confirmVendor
            ? `« ${confirmVendor.name} » sera définitivement supprimé de l'annuaire.`
            : ""
        }
        onConfirm={doRemove}
        onCancel={() => setConfirmVendor(null)}
      />
    </div>
  );
}
