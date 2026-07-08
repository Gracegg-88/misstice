"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistTask } from "@/lib/dashboard-types";

export default function ChecklistCard({
  initial,
}: {
  eventId: string;
  initial: ChecklistTask[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<ChecklistTask[]>(initial);
  const done = tasks.filter((t) => t.done).length;

  const toggle = async (id: string, current: boolean) => {
    const prev = tasks;
    setTasks((p) => p.map((x) => (x.id === id ? { ...x, done: !current } : x)));
    const supabase = createClient();
    const { error } = await supabase
      .from("checklist_tasks")
      .update({ done: !current })
      .eq("id", id);
    if (error) {
      setTasks(prev); // rollback si l'écriture échoue
      return;
    }
    router.refresh();
  };

  const fmtDate = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
      : "";

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

      {tasks.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate">
          Aucune tâche pour l&apos;instant.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-black/5">
          {tasks.slice(0, 6).map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3">
              <button
                type="button"
                role="checkbox"
                aria-checked={t.done}
                aria-label={t.label}
                onClick={() => toggle(t.id, t.done)}
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
              {t.assignee && (
                <span className="hidden rounded-md bg-violet-soft px-2 py-0.5 text-xs font-medium text-violet sm:inline">
                  {t.assignee}
                </span>
              )}
              <span className="text-xs text-slate">{fmtDate(t.due_date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
