"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Day = { date: string; available: boolean };

/**
 * Calendrier public minimal : un booléen disponible/pas disponible par jour
 * (voir public_vendor_calendar, supabase/public-availability-calendar.sql).
 * Jamais le statut détaillé (booked/pending/blocked), jamais de note privée.
 */
export default function AvailabilityCalendar({
  vendorUserId,
  onPickDate,
}: {
  vendorUserId: string;
  onPickDate: (dateISO: string) => void;
}) {
  const [days, setDays] = useState<Day[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + 60);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    supabase
      .rpc("public_vendor_calendar", {
        p_user: vendorUserId,
        p_from: fmt(from),
        p_to: fmt(to),
      })
      .then(({ data, error: rpcError }) => {
        if (rpcError) {
          setError(rpcError.message);
          return;
        }
        const rows = (data as { cal_date: string; is_available: boolean }[] | null) ?? [];
        setDays(rows.map((r) => ({ date: r.cal_date, available: r.is_available })));
      });
  }, [vendorUserId]);

  if (error) {
    return <p className="py-4 text-center text-sm text-garnet">{error}</p>;
  }
  if (!days) {
    return <p className="py-6 text-center text-sm text-slate">Chargement…</p>;
  }

  // Regroupe par mois pour l'affichage.
  const months = new Map<string, Day[]>();
  for (const d of days) {
    const key = d.date.slice(0, 7);
    if (!months.has(key)) months.set(key, []);
    months.get(key)!.push(d);
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate">
        Choisissez une date libre : votre demande de devis sera pré-remplie
        avec cette date.
      </p>
      {Array.from(months.entries()).map(([month, monthDays]) => {
        const label = new Date(`${month}-01T00:00:00`).toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        });
        return (
          <div key={month}>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate">
              {label}
            </p>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {monthDays.map((d) => {
                const day = new Date(`${d.date}T00:00:00`).getDate();
                return (
                  <button
                    key={d.date}
                    type="button"
                    disabled={!d.available}
                    onClick={() => onPickDate(d.date)}
                    className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                      d.available
                        ? "bg-emerald-soft text-emerald hover:bg-emerald hover:text-white"
                        : "bg-black/5 text-slate/40 line-through"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
