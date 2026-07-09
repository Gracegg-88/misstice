"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  FileText,
  Search,
  Phone,
  Plus,
  X,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { EventVendor } from "@/lib/dashboard-types";
import ReadOnlyBanner from "@/components/dashboard/ReadOnlyBanner";

type Status = EventVendor["status"];

const STATUSES: Status[] = ["confirmé", "en attente", "devis reçu"];

const LABEL: Record<Status, string> = {
  confirmé: "Confirmé",
  "en attente": "En attente",
  "devis reçu": "Devis reçu",
};

const STYLE: Record<Status, string> = {
  confirmé: "bg-emerald-soft text-emerald",
  "en attente": "bg-festif-soft text-festif",
  "devis reçu": "bg-violet-soft text-violet",
};

const FILTERS: { key: "Tous" | Status; label: string }[] = [
  { key: "Tous", label: "Tous" },
  { key: "confirmé", label: "Confirmé" },
  { key: "en attente", label: "En attente" },
  { key: "devis reçu", label: "Devis reçu" },
];

// Dégradés dérivés de façon déterministe (pas de colonne « gradient » en base).
const GRADIENTS = [
  "from-violet to-festif",
  "from-emerald to-violet",
  "from-festif to-emerald",
  "from-violet to-emerald",
  "from-festif to-violet",
  "from-emerald to-festif",
];

function gradientFor(v: EventVendor, index: number): string {
  const seed = (v.name || "") + (v.category || "");
  let hash = index;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

const eur = (n: number) => n.toLocaleString("fr-FR") + " €";

export default function BookedVendorsClient({
  eventId,
  initial,
  canEdit = true,
}: {
  eventId: string;
  initial: EventVendor[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [vendors, setVendors] = useState<EventVendor[]>(initial);
  const [filter, setFilter] = useState<"Tous" | Status>("Tous");

  // Modale « ajouter un prestataire »
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<Status>("en attente");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const shown = vendors.filter((v) => filter === "Tous" || v.status === filter);

  const addVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");
    const priceValue = price ? Number(price) : null;

    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("event_vendors")
      .insert({
        event_id: eventId,
        name: trimmed,
        category: category.trim() || null,
        status,
        price: priceValue,
      })
      .select("id, event_id, vendor_id, name, category, status, price")
      .single();
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    if (data) setVendors((vs) => [...vs, data as EventVendor]);
    setOpen(false);
    setName("");
    setCategory("");
    setStatus("en attente");
    setPrice("");
    router.refresh();
  };

  const cycleStatus = async (v: EventVendor) => {
    if (!canEdit) return;
    const next = STATUSES[(STATUSES.indexOf(v.status) + 1) % STATUSES.length];
    setVendors((vs) =>
      vs.map((x) => (x.id === v.id ? { ...x, status: next } : x))
    );
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("event_vendors")
      .update({ status: next })
      .eq("id", v.id);
    if (upErr) {
      // Retour arrière optimiste en cas d'échec.
      setVendors((vs) =>
        vs.map((x) => (x.id === v.id ? { ...x, status: v.status } : x))
      );
      return;
    }
    router.refresh();
  };

  const removeVendor = async (v: EventVendor) => {
    if (!canEdit) return;
    const prev = vendors;
    setVendors((vs) => vs.filter((x) => x.id !== v.id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("event_vendors")
      .delete()
      .eq("id", v.id);
    if (delErr) {
      setVendors(prev);
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-6xl">
      {!canEdit && <ReadOnlyBanner section="les prestataires" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Prestataires
          </h1>
          <p className="mt-1 text-sm text-slate">
            {vendors.length} prestataire{vendors.length > 1 ? "s" : ""} sur votre
            événement
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-plum hover:bg-cream"
            >
              <Plus size={16} />
              Ajouter un prestataire
            </button>
          )}
          <a
            href="/prestataires"
            className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            <Search size={16} />
            Trouver un prestataire
          </a>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-violet text-white"
                : "bg-white text-slate hover:text-plum"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center">
          <p className="text-sm text-slate">
            Aucun prestataire pour ce filtre. Ajoutez-en un pour commencer.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((b, i) => (
            <div
              key={b.id}
              className="overflow-hidden rounded-3xl border border-black/5 bg-white"
            >
              <div
                className={`flex h-28 items-end justify-between bg-gradient-to-br ${gradientFor(
                  b,
                  i
                )} p-4`}
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 font-display text-lg font-semibold text-plum">
                  {b.name.charAt(0)}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeVendor(b)}
                    aria-label="Supprimer le prestataire"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-plum hover:bg-white"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold text-plum">
                      {b.name}
                    </p>
                    <p className="text-sm text-slate">
                      {b.category ?? "Sans catégorie"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => cycleStatus(b)}
                    title="Changer le statut"
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[b.status]}`}
                  >
                    {b.status === "confirmé" && <BadgeCheck size={13} />}
                    {b.status === "en attente" && <Clock size={13} />}
                    {b.status === "devis reçu" && <FileText size={13} />}
                    {LABEL[b.status]}
                    <RefreshCw size={11} className="opacity-60" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                  <span className="text-sm font-semibold text-violet">
                    {b.price != null ? eur(Number(b.price)) : "—"}
                  </span>
                  {b.vendor_id ? (
                    <Link
                      href={`/prestataires/${b.vendor_id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-plum/15 px-3 py-1.5 text-sm font-semibold text-plum hover:border-plum/30"
                    >
                      <Phone size={14} />
                      Contacter
                    </Link>
                  ) : (
                    <span
                      title="Prestataire hors annuaire"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-black/5 px-3 py-1.5 text-sm font-semibold text-slate/50"
                    >
                      <Phone size={14} />
                      Contacter
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale : ajouter un prestataire */}
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Ajouter un prestataire
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addVendor} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-plum">Nom</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. Salle Élégance"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Catégorie (facultatif)
                </label>
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. Traiteur"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-plum">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Prix (€, facultatif)
                </label>
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. 4000"
                />
              </div>
              {error && <p className="text-sm text-festif">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Ajouter le prestataire"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
