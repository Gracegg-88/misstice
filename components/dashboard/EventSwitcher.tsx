"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Plus, CalendarDays, ListTree } from "lucide-react";

type Ev = { id: string; name: string; event_date: string | null };

export default function EventSwitcher({
  events,
  currentId,
}: {
  events: Ev[];
  currentId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (events.length === 0) return null;

  const current = events.find((e) => e.id === currentId) ?? events[0];

  // On n'affiche que les deux événements les plus récents dans le sélecteur ;
  // la liste complète (avec suppression) vit sur la page « Mes événements ».
  const recent = events.slice(0, 2);

  const select = (id: string) => {
    document.cookie = `current_event_id=${id}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="relative min-w-0 shrink">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[6rem] items-center gap-1 rounded-xl border border-black/5 bg-white px-2 py-1.5 hover:border-black/10 sm:max-w-[14rem] sm:gap-2 sm:px-3"
      >
        <CalendarDays size={16} className="shrink-0 text-violet" />
        <span className="truncate text-sm font-medium text-plum">
          {current?.name ?? "Événement"}
        </span>
        <ChevronDown size={15} className="shrink-0 text-slate" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-[min(16rem,calc(100vw-2rem))] rounded-2xl border border-black/5 bg-white p-1.5 shadow-lg">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate">
              Événements récents
            </p>
            {recent.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => select(e.id)}
                className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm text-plum hover:bg-cream"
              >
                <span className="truncate">{e.name}</span>
                {e.id === current?.id && (
                  <Check size={15} className="shrink-0 text-violet" />
                )}
              </button>
            ))}
            {events.length > recent.length && (
              <a
                href="/dashboard/evenements"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate hover:bg-cream"
              >
                <ListTree size={15} />
                Tous mes événements
              </a>
            )}
            <a
              href="/dashboard/nouveau"
              className="mt-1 flex items-center gap-2 rounded-xl border-t border-black/5 px-3 py-2 text-sm font-semibold text-violet hover:bg-violet-soft"
            >
              <Plus size={15} />
              Nouvel événement
            </a>
          </div>
        </>
      )}
    </div>
  );
}
