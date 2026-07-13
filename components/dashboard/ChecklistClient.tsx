"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ChecklistTask } from "@/lib/dashboard-types";
import ReadOnlyBanner from "@/components/dashboard/ReadOnlyBanner";

const FILTERS = ["Toutes", "À faire", "Terminées"] as const;

/** Formate une date ISO (yyyy-mm-dd) en « 15 mars ». */
function formatDue(due: string | null): string {
  if (!due) return "À définir";
  const d = new Date(due + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "À définir";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

type Assignee = { email: string; label: string; self: boolean };

export default function ChecklistClient({
  eventId,
  eventName,
  initial,
  assignees,
  assignerName,
  canEdit = true,
}: {
  eventId: string;
  eventName: string;
  initial: ChecklistTask[];
  assignees: Assignee[];
  assignerName: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<ChecklistTask[]>(initial);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [who, setWho] = useState("");
  const [due, setDue] = useState("");
  const [saving, setSaving] = useState(false);

  const done = tasks.filter((t) => t.done).length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  // Affiche un nom court pour l'assigné (rôle/nom plutôt que l'email complet).
  const displayAssignee = (value: string | null): string | null => {
    if (!value) return null;
    const a = assignees.find((x) => x.email === value);
    return a ? a.label.split(" · ")[0] : value;
  };
  const shown = tasks.filter((t) => {
    const okFilter =
      filter === "Toutes" ? true : filter === "À faire" ? !t.done : t.done;
    if (!okFilter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const who = displayAssignee(t.assignee) ?? "";
    return (
      t.label.toLowerCase().includes(q) || who.toLowerCase().includes(q)
    );
  });

  const toggle = async (id: string, current: boolean) => {
    if (!canEdit) return;
    setTasks((p) =>
      p.map((t) => (t.id === id ? { ...t, done: !current } : t))
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("checklist_tasks")
      .update({ done: !current })
      .eq("id", id);
    if (error) {
      // Revert en cas d'échec.
      setTasks((p) =>
        p.map((t) => (t.id === id ? { ...t, done: current } : t))
      );
      return;
    }
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!canEdit) return;
    const prev = tasks;
    setTasks((p) => p.filter((t) => t.id !== id));
    const supabase = createClient();
    const { error } = await supabase
      .from("checklist_tasks")
      .delete()
      .eq("id", id);
    if (error) {
      setTasks(prev);
      return;
    }
    router.refresh();
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!label.trim() || saving) return;
    setSaving(true);
    const position =
      tasks.reduce((m, t) => Math.max(m, t.position), 0) + 1;
    const supabase = createClient();
    const { data, error } = await supabase
      .from("checklist_tasks")
      .insert({
        event_id: eventId,
        label: label.trim(),
        assignee: who.trim() || null,
        due_date: due || null,
        done: false,
        position,
      })
      .select("id, event_id, label, assignee, due_date, done, position")
      .single();
    setSaving(false);
    if (error || !data) return;
    setTasks((p) => [...p, data as ChecklistTask]);

    // Notifie le collaborateur assigné (sauf soi-même).
    const target = assignees.find((x) => x.email === who);
    if (target && !target.self) {
      fetch("/api/notify-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          email: target.email,
          name: target.label.split(" · ")[0],
          taskLabel: label.trim(),
          assignerName,
          url: `${window.location.origin}/dashboard/checklist`,
        }),
      }).catch(() => {});
    }

    setLabel("");
    setWho("");
    setDue("");
    setAdding(false);
    router.refresh();
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
        {canEdit && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            <Plus size={16} />
            Nouvelle tâche
          </button>
        )}
      </div>
      {!canEdit && <div className="mt-5"><ReadOnlyBanner section="la checklist" /></div>}

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
          <select
            value={who}
            onChange={(e) => setWho(e.target.value)}
            aria-label="Assigner à un membre de l'équipe"
            className="rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet sm:w-52"
          >
            <option value="">Non assigné</option>
            {assignees.map((a) => (
              <option key={a.email} value={a.email}>
                {a.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-slate outline-none focus:border-violet sm:w-44"
          />
          <button
            disabled={saving}
            className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
          >
            Ajouter
          </button>
        </form>
      )}

      {/* Search */}
      <div className="relative mt-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une tâche…"
          className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 flex gap-2">
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
            <li
              key={t.id}
              className="ev-stagger-item group flex items-center gap-3 px-5 py-3.5"
              style={{ ["--i" as string]: i } as React.CSSProperties}
            >
              <button
                type="button"
                role="checkbox"
                aria-checked={t.done}
                aria-label={t.label}
                disabled={!canEdit}
                onClick={() => toggle(t.id, t.done)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  t.done
                    ? "border-emerald bg-emerald text-white"
                    : "border-black/20 hover:border-violet"
                } ${canEdit ? "" : "cursor-default"}`}
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
                <span className="hidden max-w-[8rem] truncate rounded-md bg-violet-soft px-2 py-0.5 text-xs font-medium text-violet sm:inline">
                  {displayAssignee(t.assignee)}
                </span>
              )}
              <span className="text-xs text-slate">{formatDue(t.due_date)}</span>
              {canEdit && (
                <button
                  onClick={() => remove(t.id)}
                  aria-label={`Supprimer ${t.label}`}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate opacity-0 transition-opacity hover:bg-cream hover:text-festif group-hover:opacity-100"
                >
                  <X size={15} />
                </button>
              )}
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
