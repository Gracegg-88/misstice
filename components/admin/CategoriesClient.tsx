"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Tags, Pencil, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

type Category = { id: string; name: string; position: number };

export default function CategoriesClient({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [confirmCat, setConfirmCat] = useState<Category | null>(null);

  const supabase = () => createClient();

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    setSaving(true);
    setError("");
    const nextPos = categories.length
      ? Math.max(...categories.map((c) => c.position)) + 1
      : 1;
    const { error: insErr } = await supabase()
      .from("vendor_categories")
      .insert({ name: value, position: nextPos });
    setSaving(false);
    if (insErr) {
      setError(
        insErr.message.toLowerCase().includes("duplicate")
          ? "Cette catégorie existe déjà."
          : insErr.message
      );
      return;
    }
    setName("");
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

  const startEdit = (c: Category) => {
    setError("");
    setEditId(c.id);
    setEditValue(c.name);
  };

  const saveEdit = async (id: string) => {
    const value = editValue.trim();
    if (!value) return;
    setError("");
    const { error: upErr } = await supabase()
      .from("vendor_categories")
      .update({ name: value })
      .eq("id", id);
    if (upErr) {
      setError(
        upErr.message.toLowerCase().includes("duplicate")
          ? "Cette catégorie existe déjà."
          : upErr.message
      );
      return;
    }
    setEditId(null);
    router.refresh();
  };

  const iconBtn =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate transition-colors";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Catégories de prestataire
      </h1>
      <p className="mt-1 text-sm text-slate">
        {categories.length} catégorie{categories.length > 1 ? "s" : ""}. Elles
        s&apos;appliquent au référencement et aux filtres.
      </p>

      {/* Ajouter */}
      <form onSubmit={add} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nouvelle catégorie (ex. Location de mobilier)"
          className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-plum outline-none placeholder:text-slate focus:border-violet"
        />
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-60"
        >
          <Plus size={16} />
          Ajouter
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-festif">{error}</p>}

      {/* Grille */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length === 0 && (
          <p className="rounded-2xl border border-dashed border-black/10 px-4 py-8 text-center text-sm text-slate sm:col-span-2 lg:col-span-3">
            Aucune catégorie. Ajoutez-en une ci-dessus.
          </p>
        )}
        {categories.map((c) =>
          editId === c.id ? (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-2xl border border-violet/40 bg-white p-2.5 shadow-sm"
            >
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(c.id);
                  if (e.key === "Escape") setEditId(null);
                }}
                className="min-w-0 flex-1 rounded-lg border border-black/10 bg-cream px-3 py-1.5 text-sm outline-none focus:border-violet"
              />
              <button
                type="button"
                aria-label="Enregistrer"
                onClick={() => saveEdit(c.id)}
                className={`${iconBtn} bg-violet text-white hover:bg-violet-dark`}
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                aria-label="Annuler"
                onClick={() => setEditId(null)}
                className={`${iconBtn} hover:bg-cream`}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div
              key={c.id}
              className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-violet">
                <Tags size={15} />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-plum">
                {c.name}
              </span>
              <button
                type="button"
                aria-label={`Renommer ${c.name}`}
                onClick={() => startEdit(c)}
                className={`${iconBtn} hover:bg-violet-soft hover:text-violet`}
              >
                <Pencil size={15} />
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
          )
        )}
      </div>

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
