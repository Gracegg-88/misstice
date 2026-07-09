"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  Plus,
  Trash2,
  Users,
  ArrowRight,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { ManagedEvent } from "@/app/dashboard/evenements/page";

function formatDate(d: string | null): string {
  if (!d) return "Date à définir";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function EventsManagerClient({
  initial,
  currentId,
}: {
  initial: ManagedEvent[];
  currentId: string;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<ManagedEvent[]>(initial);
  const [current, setCurrent] = useState(currentId);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const select = (id: string) => {
    document.cookie = `current_event_id=${id}; path=/; max-age=31536000; samesite=lax`;
    setCurrent(id);
    router.refresh();
  };

  const remove = async (id: string) => {
    setBusy(true);
    const prev = events;
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", id);
    setBusy(false);
    setConfirmId(null);
    if (error) {
      setEvents(prev);
      return;
    }
    // Si on supprime l'événement courant, on bascule sur un autre.
    if (id === current) {
      const fallback = next[0]?.id ?? "";
      if (fallback) {
        document.cookie = `current_event_id=${fallback}; path=/; max-age=31536000; samesite=lax`;
        setCurrent(fallback);
      }
    }
    router.refresh();
  };

  const toDelete = events.find((e) => e.id === confirmId) ?? null;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Mes événements
          </h1>
          <p className="mt-1 text-sm text-slate">
            {events.length} événement{events.length > 1 ? "s" : ""} — sélectionnez
            celui sur lequel travailler.
          </p>
        </div>
        <a
          href="/dashboard/nouveau"
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Plus size={16} />
          Nouvel événement
        </a>
      </div>

      <div className="mt-6 space-y-3">
        {events.map((e) => {
          const active = e.id === current;
          return (
            <div
              key={e.id}
              className={`flex flex-wrap items-center gap-4 rounded-3xl border bg-white p-4 sm:p-5 ${
                active ? "border-violet ring-1 ring-violet" : "border-black/5"
              }`}
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                <CalendarDays size={22} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-display text-lg font-semibold text-plum">
                    {e.name}
                  </p>
                  {active && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-violet px-2 py-0.5 text-[11px] font-semibold text-white">
                      <Check size={12} />
                      Actif
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate">
                  <span>{formatDate(e.event_date)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users size={13} />
                    {e.guest_count} invités
                  </span>
                  {!e.isOwner && (
                    <span className="text-xs text-slate/70">Partagé avec vous</span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!active && (
                  <button
                    type="button"
                    onClick={() => select(e.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-plum/15 px-3 py-2 text-sm font-semibold text-plum hover:border-plum/30"
                  >
                    Ouvrir
                    <ArrowRight size={14} />
                  </button>
                )}
                {e.isOwner && (
                  <button
                    type="button"
                    onClick={() => setConfirmId(e.id)}
                    aria-label="Supprimer l'événement"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 text-festif hover:bg-festif-soft"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation de suppression */}
      {toDelete && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-plum/50"
            onClick={() => setConfirmId(null)}
          />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Supprimer l&apos;événement
              </h3>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-slate">
              « {toDelete.name} » et toutes ses données (budget, invités, planning…)
              seront définitivement supprimés. Cette action est irréversible.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="flex-1 rounded-2xl border border-black/10 py-3 text-sm font-semibold text-plum hover:bg-cream"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => remove(toDelete.id)}
                className="flex-1 rounded-2xl bg-festif py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
