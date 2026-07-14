"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Clock,
  XCircle,
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

const STATUSES: Status[] = ["en attente", "confirmé", "refusé"];

const LABEL: Record<Status, string> = {
  confirmé: "Confirmé",
  "en attente": "En attente",
  refusé: "Refusé",
};

const STYLE: Record<Status, string> = {
  confirmé: "bg-emerald-soft text-emerald",
  "en attente": "bg-festif-soft text-festif",
  refusé: "bg-black/5 text-slate",
};

const FILTERS: { key: "Tous" | Status; label: string }[] = [
  { key: "Tous", label: "Tous" },
  { key: "en attente", label: "En attente" },
  { key: "confirmé", label: "Confirmé" },
  { key: "refusé", label: "Refusé" },
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
  convByVendor = {},
  canEdit = true,
}: {
  eventId: string;
  initial: EventVendor[];
  convByVendor?: Record<string, string>;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [vendors, setVendors] = useState<EventVendor[]>(initial);
  // Resynchronise avec le serveur après un router.refresh().
  useEffect(() => setVendors(initial), [initial]);
  const [filter, setFilter] = useState<"Tous" | Status>("Tous");

  // Modale « ajouter un prestataire »
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<Status>("en attente");
  const [price, setPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const shown = vendors.filter(
    (v) =>
      (filter === "Tous" || v.status === filter) &&
      (!q ||
        `${v.name} ${v.category ?? ""}`.toLowerCase().includes(q))
  );

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
    const { data, error: upErr } = await supabase
      .from("event_vendors")
      .update({ status: next })
      .eq("id", v.id)
      .select("id");
    if (upErr || !data || data.length === 0) {
      // Retour arrière optimiste (échec ou blocage RLS silencieux).
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
    const { data, error: delErr } = await supabase
      .from("event_vendors")
      .delete()
      .eq("id", v.id)
      .select("id");
    if (delErr || !data || data.length === 0) {
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
          {canEdit && (
            <a
              href="/prestataires"
              className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
            >
              <Search size={16} />
              Trouver un prestataire
            </a>
          )}
        </div>
      </div>

      {/* Recherche */}
      <div className="relative mt-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un prestataire…"
          className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
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
                className={`relative flex h-28 items-end justify-between bg-gradient-to-br ${gradientFor(
                  b,
                  i
                )} p-4`}
              >
                {b.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}
                <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/90 font-display text-lg font-semibold text-plum">
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    b.name.charAt(0)
                  )}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => removeVendor(b)}
                    aria-label="Supprimer le prestataire"
                    className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/85 text-plum hover:bg-white"
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
                  {b.vendor_id ? (
                    // Prestataire de l'annuaire : statut AUTO (suit les devis).
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[b.status]}`}
                      title="Statut mis à jour automatiquement selon les devis"
                    >
                      {b.status === "confirmé" && <BadgeCheck size={13} />}
                      {b.status === "en attente" && <Clock size={13} />}
                      {b.status === "refusé" && <XCircle size={13} />}
                      {LABEL[b.status]}
                    </span>
                  ) : (
                    // Prestataire hors annuaire : statut modifiable à la main.
                    <button
                      type="button"
                      onClick={() => cycleStatus(b)}
                      title="Changer le statut"
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[b.status]}`}
                    >
                      {b.status === "confirmé" && <BadgeCheck size={13} />}
                      {b.status === "en attente" && <Clock size={13} />}
                      {b.status === "refusé" && <XCircle size={13} />}
                      {LABEL[b.status]}
                      <RefreshCw size={11} className="opacity-60" />
                    </button>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                  <span className="text-sm font-semibold text-violet">
                    {b.price != null ? eur(Number(b.price)) : "—"}
                  </span>
                  {/* « Contacter » ouvre la conversation (masqué en lecture seule). */}
                  {canEdit &&
                    (b.vendor_id && convByVendor[b.vendor_id] ? (
                      <Link
                        href={`/dashboard/messages/${convByVendor[b.vendor_id]}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-plum/15 px-3 py-1.5 text-sm font-semibold text-plum hover:border-plum/30"
                      >
                        <Phone size={14} />
                        Contacter
                      </Link>
                    ) : b.vendor_id ? (
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
                    ))}
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
