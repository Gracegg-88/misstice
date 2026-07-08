"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, TrendingUp, Plus, X, SlidersHorizontal, Trash2 } from "lucide-react";
import CountUp from "@/components/animations/CountUp";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";

type Cat = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  color: string;
};

// Palette de la charte pour colorer les nouvelles catégories.
const PALETTE = [
  "#6C3CE1", "#FF8C42", "#10B981", "#A855F7", "#EC4899",
  "#3B82F6", "#6366F1", "#F43F5E", "#F59E0B", "#6B7280",
];

export default function BudgetClient({
  eventId,
  eventName,
  budgetTotal,
  categories,
}: {
  eventId: string;
  eventName: string;
  budgetTotal: number;
  categories: Cat[];
}) {
  const router = useRouter();
  const cats = categories;

  // Modale « ajouter une dépense »
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(categories[0]?.id ?? "");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Modale « définir les budgets »
  const [editOpen, setEditOpen] = useState(false);
  const [budgets, setBudgets] = useState<Record<string, string>>(
    Object.fromEntries(categories.map((c) => [c.id, String(c.budget)]))
  );
  const [savingBudgets, setSavingBudgets] = useState(false);
  const [totalInput, setTotalInput] = useState(String(budgetTotal || ""));

  // Ajout d'une catégorie
  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [busyCat, setBusyCat] = useState(false);

  // Resynchronise les champs après un router.refresh() (ajout/suppression).
  useEffect(() => {
    setBudgets(
      Object.fromEntries(categories.map((c) => [c.id, String(c.budget)]))
    );
  }, [categories]);

  useEffect(() => {
    setTotalInput(String(budgetTotal || ""));
  }, [budgetTotal]);

  const spent = cats.reduce((s, c) => s + c.spent, 0);
  const catBudgetSum = cats.reduce((s, c) => s + c.budget, 0);
  const total = budgetTotal || catBudgetSum;
  const remaining = total - spent;
  const pct = total ? Math.round((spent / total) * 100) : 0;
  const eur = (n: number) => n.toLocaleString("fr-FR") + "€";

  const addExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = Math.round(parseFloat(amount.replace(",", ".")) * 100) / 100;
    if (!v || v <= 0 || !cat) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: insErr } = await supabase.from("budget_expenses").insert({
      event_id: eventId,
      category_id: cat,
      amount: v,
      label: label.trim() || null,
    });
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setOpen(false);
    setAmount("");
    setLabel("");
    router.refresh();
  };

  const saveBudgets = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBudgets(true);
    setError("");
    const supabase = createClient();
    // Met à jour uniquement les catégories dont le budget a changé.
    const changed = cats.filter(
      (c) => Number(budgets[c.id] || 0) !== c.budget
    );
    for (const c of changed) {
      const { error: upErr } = await supabase
        .from("budget_categories")
        .update({ budget: Number(budgets[c.id] || 0) })
        .eq("id", c.id);
      if (upErr) {
        setSavingBudgets(false);
        setError(upErr.message);
        return;
      }
    }
    // Budget prévisionnel total de l'événement (réservé au propriétaire :
    // un collaborateur matche 0 ligne via RLS → on le détecte et on prévient).
    const newTotal = Number(totalInput) || 0;
    if (newTotal !== budgetTotal) {
      const { data: updated, error: evErr } = await supabase
        .from("events")
        .update({ budget_total: newTotal })
        .eq("id", eventId)
        .select("id");
      if (evErr) {
        setSavingBudgets(false);
        setError(evErr.message);
        return;
      }
      if (!updated || updated.length === 0) {
        setSavingBudgets(false);
        setError(
          "Seul le propriétaire de l'événement peut modifier le budget total."
        );
        return;
      }
    }
    setSavingBudgets(false);
    setEditOpen(false);
    router.refresh();
  };

  const addCategory = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusyCat(true);
    setError("");
    const supabase = createClient();
    const color = PALETTE[cats.length % PALETTE.length];
    const { error: insErr } = await supabase.from("budget_categories").insert({
      event_id: eventId,
      name,
      budget: Number(newBudget) || 0,
      color,
      position: cats.length + 1,
    });
    setBusyCat(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setNewName("");
    setNewBudget("");
    router.refresh();
  };

  const [confirmCat, setConfirmCat] = useState<{ id: string; name: string } | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  const deleteCategory = async () => {
    if (!confirmCat) return;
    setDeleting(true);
    setError("");
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("budget_categories")
      .delete()
      .eq("id", confirmCat.id);
    setDeleting(false);
    setConfirmCat(null);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <ConfirmDialog
        open={!!confirmCat}
        title="Supprimer cette catégorie ?"
        message={`« ${confirmCat?.name ?? ""} » et toutes ses dépenses seront définitivement supprimées.`}
        loading={deleting}
        onConfirm={deleteCategory}
        onCancel={() => setConfirmCat(null)}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Budget
          </h1>
          <p className="mt-1 text-sm text-slate">
            {eventName} · budget total {eur(total)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-plum hover:bg-cream"
          >
            <SlidersHorizontal size={16} />
            Définir les budgets
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            <Plus size={16} />
            Ajouter une dépense
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { l: "Budget total", n: total, sub: "Prévisionnel", c: "text-plum" },
          { l: "Dépensé", n: spent, sub: `${pct}% du budget`, c: "text-festif" },
          {
            l: "Restant",
            n: remaining,
            sub: `${Math.max(0, 100 - pct)}% disponible`,
            c: "text-emerald",
          },
        ].map((s) => (
          <div key={s.l} className="rounded-3xl border border-black/5 bg-white p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-slate">
              {s.l}
            </p>
            <p className={`mt-2 font-display text-3xl font-semibold ${s.c}`}>
              <CountUp value={s.n} suffix="€" />
            </p>
            <p className="mt-1 text-sm text-slate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Progression */}
      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-violet" />
            <h2 className="font-display text-lg font-semibold text-plum">
              Progression du budget
            </h2>
          </div>
          <span className="text-sm font-semibold text-violet">{pct}% utilisé</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet to-festif"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate">
          <span>0€</span>
          <span>{eur(spent)} dépensés</span>
          <span>{eur(total)}</span>
        </div>
      </div>

      {/* Répartition par catégorie */}
      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <div className="flex items-center gap-2">
          <Wallet size={20} className="text-violet" />
          <h2 className="font-display text-lg font-semibold text-plum">
            Répartition par catégorie
          </h2>
        </div>
        <div className="mt-5 space-y-5">
          {cats.map((c) => {
            const p = c.budget ? Math.round((c.spent / c.budget) * 100) : 0;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-plum">{c.name}</span>
                  <span
                    className={`font-semibold ${
                      c.spent === 0 ? "text-slate" : "text-plum"
                    }`}
                  >
                    {c.spent === 0 ? "Non commencé" : `${p}%`}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.min(100, p)}%`, background: c.color }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-xs text-slate">
                  <span>{eur(c.spent)} dépensés</span>
                  <span>Budget : {eur(c.budget)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modale : ajouter une dépense */}
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Ajouter une dépense
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addExpense} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-plum">Catégorie</label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                >
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Intitulé (facultatif)
                </label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. Acompte traiteur"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Montant (€)
                </label>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. 250"
                />
              </div>
              {error && <p className="text-sm text-festif">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Ajouter la dépense"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modale : définir les budgets par catégorie */}
      {editOpen && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setEditOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Définir les budgets
              </h3>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>
            {/* Budget prévisionnel total */}
            <label className="text-sm font-medium text-plum">
              Budget prévisionnel total (€)
            </label>
            <input
              type="number"
              min={0}
              value={totalInput}
              onChange={(e) => setTotalInput(e.target.value)}
              placeholder="ex. 15000"
              aria-label="Budget prévisionnel total"
              className="mb-4 mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
            />

            {/* Ajouter une catégorie */}
            <div className="mb-3 flex items-center gap-2 rounded-2xl bg-cream p-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nouvelle catégorie"
                className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-violet"
              />
              <input
                type="number"
                min={0}
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="0"
                aria-label="Budget de la nouvelle catégorie"
                className="w-20 rounded-xl border border-black/10 bg-white px-3 py-2 text-right text-sm outline-none focus:border-violet"
              />
              <button
                type="button"
                onClick={addCategory}
                disabled={busyCat || !newName.trim()}
                aria-label="Ajouter la catégorie"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet text-white hover:bg-violet-dark disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>

            <form onSubmit={saveBudgets} className="space-y-3">
              <div className="max-h-[45vh] space-y-3 overflow-y-auto pr-1">
                {cats.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: c.color }}
                    />
                    <span className="flex-1 truncate text-sm text-plum">{c.name}</span>
                    <input
                      type="number"
                      min={0}
                      aria-label={`Budget ${c.name}`}
                      value={budgets[c.id] ?? ""}
                      onChange={(ev) =>
                        setBudgets((b) => ({ ...b, [c.id]: ev.target.value }))
                      }
                      className="w-24 rounded-xl border border-black/10 bg-cream px-3 py-2 text-right text-sm outline-none focus:border-violet"
                    />
                    <button
                      type="button"
                      aria-label={`Supprimer ${c.name}`}
                      onClick={() => setConfirmCat({ id: c.id, name: c.name })}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate hover:bg-festif-soft hover:text-festif"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                {cats.length === 0 && (
                  <p className="py-4 text-center text-sm text-slate">
                    Aucune catégorie. Ajoutez-en une ci-dessous.
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-festif">{error}</p>}
              <button
                type="submit"
                disabled={savingBudgets}
                className="mt-2 w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {savingBudgets ? "Enregistrement…" : "Enregistrer les budgets"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
