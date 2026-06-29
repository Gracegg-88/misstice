"use client";

import { useState } from "react";
import { CheckSquare } from "lucide-react";

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
  { id: 3, label: "Envoyer les invitations", who: "Maman", date: "1 Avril", done: false },
  { id: 4, label: "Choisir le DJ", who: "Tonton Alain", date: "5 Avril", done: false },
  { id: 5, label: "Commander le gâteau", who: "Sophie", date: "10 Mai", done: false },
  { id: 6, label: "Essayage robe", who: "Sophie", date: "15 Mai", done: false },
];

export default function ChecklistCard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL);
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare size={20} className="text-violet" />
          <h2 className="font-display text-lg font-semibold text-plum">
            Checklist
          </h2>
        </div>
        <span className="text-sm text-slate">
          {done}/{tasks.length} complétées
        </span>
      </div>

      <ul className="mt-4 divide-y divide-black/5">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <button
              role="checkbox"
              aria-checked={t.done}
              aria-label={t.label}
              onClick={() =>
                setTasks((prev) =>
                  prev.map((x) =>
                    x.id === t.id ? { ...x, done: !x.done } : x
                  )
                )
              }
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
      </ul>
    </div>
  );
}
