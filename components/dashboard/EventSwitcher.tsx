"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Check, Plus, CalendarDays } from "lucide-react";

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

  const select = (id: string) => {
    document.cookie = `current_event_id=${id}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-3 py-1.5 hover:border-black/10"
      >
        <CalendarDays size={16} className="text-violet" />
        <span className="max-w-[10rem] truncate text-sm font-medium text-plum">
          {current?.name ?? "Événement"}
        </span>
        <ChevronDown size={15} className="text-slate" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-black/5 bg-white p-1.5 shadow-lg">
            <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate">
              Mes événements
            </p>
            {events.map((e) => (
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
