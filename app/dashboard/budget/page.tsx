"use client";

import { useState } from "react";
import { Wallet, TrendingUp, Plus, X } from "lucide-react";
import CountUp from "@/components/animations/CountUp";

type Cat = { name: string; spent: number; budget: number; color: string };

const INITIAL: Cat[] = [
  { name: "Lieu & Salle", spent: 3000, budget: 4000, color: "#6C3CE1" },
  { name: "Traiteur", spent: 2500, budget: 4500, color: "#FF8C42" },
  { name: "Photographe / Vidéo", spent: 1500, budget: 2000, color: "#10B981" },
  { name: "Musique & DJ", spent: 750, budget: 1200, color: "#A855F7" },
  { name: "Décoration & Fleurs", spent: 1000, budget: 1500, color: "#EC4899" },
  { name: "Tenue & Coiffure", spent: 0, budget: 1800, color: "#3B82F6" },
  { name: "Faire-part & Papeterie", spent: 120, budget: 300, color: "#6366F1" },
  { name: "Transport", spent: 0, budget: 400, color: "#F43F5E" },
  { name: "Gâteau", spent: 0, budget: 600, color: "#F59E0B" },
  { name: "Divers", spent: 380, budget: 700, color: "#6B7280" },
];

export default function BudgetPage() {
  const [cats, setCats] = useState<Cat[]>(INITIAL);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(INITIAL[0].name);
  const [amount, setAmount] = useState("");

  const total = cats.reduce((s, c) => s + c.budget, 0);
  const spent = cats.reduce((s, c) => s + c.spent, 0);
  const remaining = total - spent;
  const pct = Math.round((spent / total) * 100);
  const eur = (n: number) => n.toLocaleString("fr-FR") + "€";

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseInt(amount, 10);
    if (!v) return;
    setCats((c) =>
      c.map((x) => (x.name === cat ? { ...x, spent: x.spent + v } : x))
    );
    setOpen(false);
    setAmount("");
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Budget
          </h1>
          <p className="mt-1 text-sm text-slate">
            Mariage de Sophie &amp; Marc · budget total {eur(total)}
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Plus size={16} />
          Ajouter une dépense
        </button>
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { l: "Budget total", n: total, sub: "Défini à la création", c: "text-plum" },
          { l: "Dépensé", n: spent, sub: `${pct}% du budget`, c: "text-festif" },
          { l: "Restant", n: remaining, sub: `${100 - pct}% disponible`, c: "text-emerald" },
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
            style={{ width: `${pct}%` }}
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
              <div key={c.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-plum">{c.name}</span>
                  <span
                    className={`font-semibold ${
                      p === 0 ? "text-slate" : "text-plum"
                    }`}
                  >
                    {p === 0 ? "Non commencé" : `${p}%`}
                  </span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-cream">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p}%`, background: c.color }}
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

      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Ajouter une dépense
              </h3>
              <button
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
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
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
              <button className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark">
                Ajouter la dépense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
