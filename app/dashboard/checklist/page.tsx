"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type Task = {
  id: number;
  label: string;
  who: string;
  date: string;
  done: boolean;
};

const INITIAL: Task[] = [
  { id: 1, label: "Confirmer le lieu de réception", who: "Sophie", date: "15 Mars", done: true },
  { id: 2, label: "Réserver le traiteur", who: "Marc", date: "20 Mars", done: true },
  { id: 3, label: "Commander les faire-part", who: "Maman", date: "28 Mars", done: true },
  { id: 4, label: "Envoyer les invitations", who: "Maman", date: "1 Avril", done: false },
  { id: 5, label: "Choisir le DJ", who: "Tonton Alain", date: "5 Avril", done: false },
  { id: 6, label: "Commander le gâteau", who: "Sophie", date: "10 Mai", done: false },
  { id: 7, label: "Essayage robe", who: "Sophie", date: "15 Mai", done: false },
  { id: 8, label: "Plan de table", who: "Marc", date: "1 Juin", done: false },
];

const FILTERS = ["Toutes", "À faire", "Terminées"] as const;

export default function ChecklistPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [who, setWho] = useState("");

  const done = tasks.filter((t) => t.done).length;
  const pct = Math.round((done / tasks.length) * 100);
  const shown = tasks.filter((t) =>
    filter === "Toutes" ? true : filter === "À faire" ? !t.done : t.done
  );

  const toggle = (id: number) =>
    setTasks((p) => p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setTasks((p) => [
      ...p,
      { id: Date.now(), label, who: who || "Non assigné", date: "À définir", done: false },
    ]);
    setLabel("");
    setWho("");
    setAdding(false);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Checklist
          </h1>
          <p className="mt-1 text-sm text-slate">
            {done} sur {tasks.length} tâches complétées · {pct}%
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Plus size={16} />
          Nouvelle tâche
        </button>
      </div>

      {/* Progress */}
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet to-emerald"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Add form */}
      {adding && (
        <form
          onSubmit={add}
          className="mt-5 flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row"
        >
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nouvelle tâche…"
            className="flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
          />
          <input
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="Assigné à"
            className="rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet sm:w-40"
          />
          <button className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark">
            Ajouter
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="mt-6 flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-violet text-white"
                : "bg-white text-slate hover:text-plum"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="mt-4 rounded-3xl border border-black/5 bg-white">
        <ul className="divide-y divide-black/5">
          {shown.map((t, i) => (
            <li key={t.id} className="ev-stagger-item flex items-center gap-3 px-5 py-3.5" style={{ ["--i" as string]: i } as React.CSSProperties}>
              <button
                role="checkbox"
                aria-checked={t.done}
                aria-label={t.label}
                onClick={() => toggle(t.id)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  t.done
                    ? "border-emerald bg-emerald text-white"
                    : "border-black/20 hover:border-violet"
                }`}
              >
                {t.done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12l5 5L20 6" />
                  </svg>
                )}
              </button>
              <span
                className={`flex-1 text-sm ${
                  t.done ? "text-slate line-through" : "text-plum"
                }`}
              >
                {t.label}
              </span>
              <span className="hidden rounded-md bg-violet-soft px-2 py-0.5 text-xs font-medium text-violet sm:inline">
                {t.who}
              </span>
              <span className="text-xs text-slate">{t.date}</span>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-slate">
              Rien ici pour ce filtre.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
