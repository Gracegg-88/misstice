"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Tags,
  Pencil,
  Eye,
  EyeOff,
  Search,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

export type AdminCategory = {
  id: string;
  name: string;
  position: number;
  description: string | null;
  active: boolean;
  created_at: string;
  count: number;
};

const STATUS = ["Toutes", "Actives", "Désactivées"] as const;
type Status = (typeof STATUS)[number];

function monthYear(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
}

export default function CategoriesClient({
  categories,
  totalVendors,
}: {
  categories: AdminCategory[];
  totalVendors: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("Toutes");
  const [error, setError] = useState("");
  const [confirmCat, setConfirmCat] = useState<AdminCategory | null>(null);

  // Modale d'ajout / d'édition (nom + description, sans avatar ni branche).
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = () => createClient();
  const activeCount = categories.filter((c) => c.active).length;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories.filter((c) => {
      if (status === "Actives" && !c.active) return false;
      if (status === "Désactivées" && c.active) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [categories, query, status]);

  const openNew = () => {
    setError("");
    setFormName("");
    setFormDesc("");
    setEditing("new");
  };
  const openEdit = (c: AdminCategory) => {
    setError("");
    setFormName(c.name);
    setFormDesc(c.description ?? "");
    setEditing(c);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formName.trim();
    if (!name || saving) return;
    setSaving(true);
    setError("");
    if (editing === "new") {
      const nextPos = categories.length
        ? Math.max(...categories.map((c) => c.position)) + 1
        : 1;
      const { error: insErr } = await supabase()
        .from("vendor_categories")
        .insert({
          name,
          description: formDesc.trim() || null,
          position: nextPos,
          active: true,
        });
      setSaving(false);
      if (insErr) {
        setError(
          insErr.message.toLowerCase().includes("duplicate")
            ? "Cette catégorie existe déjà."
            : insErr.message
        );
        return;
      }
    } else if (editing) {
      const { error: upErr } = await supabase()
        .from("vendor_categories")
        .update({ name, description: formDesc.trim() || null })
        .eq("id", editing.id);
      setSaving(false);
      if (upErr) {
        setError(
          upErr.message.toLowerCase().includes("duplicate")
            ? "Cette catégorie existe déjà."
            : upErr.message
        );
        return;
      }
    }
    setEditing(null);
    router.refresh();
  };

  const toggleActive = async (c: AdminCategory) => {
    setError("");
    const { error: upErr } = await supabase()
      .from("vendor_categories")
      .update({ active: !c.active })
      .eq("id", c.id);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    router.refresh();
  };

  const doRemove = async () => {
    if (!confirmCat) return;
    setError("");
    const { error: delErr } = await supabase()
      .from("vendor_categories")
      .delete()
      .eq("id", confirmCat.id);
    setConfirmCat(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  const iconBtn =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/10 text-slate transition-colors";

  return (
    <div className="mx-auto max-w-5xl">
      {/* En-tête : titre + compteur + recherche + bouton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Catégories
          </h1>
          <p className="mt-1 text-sm text-slate">
            {activeCount} catégorie{activeCount > 1 ? "s" : ""} active
            {activeCount > 1 ? "s" : ""} sur {categories.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une catégorie…"
              className="w-full rounded-xl border border-black/10 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-violet"
            />
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvelle catégorie</span>
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-festif">{error}</p>}

      {/* Filtres de statut */}
      <div className="mt-6 flex gap-2">
        {STATUS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              status === s
                ? "bg-violet text-white"
                : "bg-white text-slate hover:text-plum"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-black/5 bg-white">
        <ul className="divide-y divide-black/5">
          {shown.map((c) => {
            const pct = totalVendors
              ? Math.round((c.count / totalVendors) * 100)
              : 0;
            return (
              <li
                key={c.id}
                className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
              >
                {/* Identité */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      c.active
                        ? "bg-violet-soft text-violet"
                        : "bg-cream text-slate"
                    }`}
                  >
                    <Tags size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-plum">
                      {c.name}
                    </p>
                    {c.description && (
                      <p className="truncate text-sm text-slate">
                        {c.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prestataires + progression */}
                <div className="w-full sm:w-40 sm:shrink-0">
                  <p className="text-sm text-plum">
                    <span className="font-semibold">{c.count}</span> prestataire
                    {c.count > 1 ? "s" : ""} · {pct}%
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-violet"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>

                {/* Statut */}
                <div className="shrink-0 sm:w-28">
                  {c.active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-medium text-emerald">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-slate">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate" />
                      Désactivée
                    </span>
                  )}
                </div>

                {/* Date */}
                <span className="shrink-0 text-sm text-slate sm:w-20">
                  {monthYear(c.created_at)}
                </span>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label={`Modifier ${c.name}`}
                    onClick={() => openEdit(c)}
                    className={`${iconBtn} hover:bg-violet-soft hover:text-violet`}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label={c.active ? `Désactiver ${c.name}` : `Activer ${c.name}`}
                    onClick={() => toggleActive(c)}
                    className={`${iconBtn} hover:bg-cream hover:text-plum`}
                  >
                    {c.active ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button
                    type="button"
                    aria-label={`Supprimer ${c.name}`}
                    onClick={() => setConfirmCat(c)}
                    className={`${iconBtn} hover:bg-festif-soft hover:text-festif`}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </li>
            );
          })}
          {shown.length === 0 && (
            <li className="px-5 py-12 text-center text-sm text-slate">
              {query.trim() || status !== "Toutes"
                ? "Aucune catégorie ne correspond."
                : "Aucune catégorie. Ajoutez-en une avec « Nouvelle catégorie »."}
            </li>
          )}
        </ul>
      </div>

      {/* Modale ajout / édition */}
      {editing && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                {editing === "new" ? "Nouvelle catégorie" : "Modifier la catégorie"}
              </h3>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setEditing(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-plum">Nom</label>
                <input
                  autoFocus
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ex. Photographe"
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Description (facultative)
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  placeholder="ex. Reportage photo de mariages et événements"
                  className="mt-1.5 w-full resize-none rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                />
              </div>
              {error && <p className="text-sm text-festif">{error}</p>}
              <button
                type="submit"
                disabled={saving || !formName.trim()}
                className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {saving
                  ? "Enregistrement…"
                  : editing === "new"
                    ? "Créer la catégorie"
                    : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmCat !== null}
        title="Supprimer la catégorie"
        message={
          confirmCat
            ? `« ${confirmCat.name} » sera retirée du référencement et des filtres.`
            : ""
        }
        onConfirm={doRemove}
        onCancel={() => setConfirmCat(null)}
      />
    </div>
  );
}
