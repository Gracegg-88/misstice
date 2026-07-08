"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Lock,
  Check,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Availability } from "@/lib/pro-types";

export type QuoteEvent = {
  id: string;
  date: string; // yyyy-mm-dd
  title: string;
  location: string | null;
  status: "envoyé" | "accepté" | "refusé" | "expiré";
};

type Status = Availability["status"]; // available | booked | pending | blocked
type DayState = { id: string; status: Status; note: string | null };

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const STATUS_LABEL: Record<Status, string> = {
  available: "Disponible",
  pending: "Devis en attente",
  blocked: "Bloqué",
  booked: "Événement confirmé",
};
const DOT: Record<Status, string> = {
  available: "bg-emerald",
  pending: "bg-festif",
  blocked: "bg-slate/60",
  booked: "bg-violet",
};
const PILL: Record<Status, string> = {
  available: "bg-emerald-soft text-emerald",
  pending: "bg-festif-soft text-festif",
  blocked: "bg-black/5 text-slate",
  booked: "bg-violet-soft text-violet",
};

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function longDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return cap(
    new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  );
}

export default function CalendrierClient({
  initial,
  events,
}: {
  initial: Availability[];
  events: QuoteEvent[];
}) {
  const router = useRouter();

  const [map, setMap] = useState<Record<string, DayState>>(() =>
    Object.fromEntries(
      initial.map((a) => [a.date, { id: a.id, status: a.status, note: a.note }])
    )
  );
  const [error, setError] = useState("");

  // Meilleur devis par date : accepté prioritaire, sinon envoyé.
  const eventByDate = useMemo(() => {
    const rank = (s: QuoteEvent["status"]) =>
      s === "accepté" ? 2 : s === "envoyé" ? 1 : 0;
    const m: Record<string, QuoteEvent> = {};
    for (const e of events) {
      if (rank(e.status) === 0) continue;
      if (!m[e.date] || rank(e.status) > rank(m[e.date].status)) m[e.date] = e;
    }
    return m;
  }, [events]);

  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(todayKey);

  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  // Statut effectif d'une date : disponibilité enregistrée, sinon déduit du devis.
  const effStatus = (key: string): Status | null => {
    const a = map[key];
    if (a) return a.status;
    const e = eventByDate[key];
    if (e?.status === "accepté") return "booked";
    if (e?.status === "envoyé") return "pending";
    return null;
  };

  const cells = useMemo(() => {
    const first = new Date(view.year, view.month, 1);
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const arr: (number | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);
    return arr;
  }, [view]);

  // Compteurs du mois affiché.
  const stats = useMemo(() => {
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    let booked = 0, pending = 0, blocked = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const s = effStatus(dateKey(view.year, view.month, d));
      if (s === "booked") booked++;
      else if (s === "pending") pending++;
      else if (s === "blocked") blocked++;
    }
    return {
      booked,
      pending,
      blocked,
      available: daysInMonth - booked - pending - blocked,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, map, eventByDate]);

  const selStatus = effStatus(selected);
  const selEvent = eventByDate[selected];
  const selNote = map[selected]?.note ?? "";

  useEffect(() => {
    setEditingNote(false);
    setNoteDraft(map[selected]?.note ?? "");
  }, [selected, map]);

  const changeMonth = (delta: number) =>
    setView((v) => {
      const m = v.month + delta;
      return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });

  // Enregistre (upsert) le statut/note d'une journée.
  const apply = async (key: string, status: Status, note: string | null) => {
    const prev = map;
    setMap((m) => ({ ...m, [key]: { id: m[key]?.id ?? "tmp", status, note } }));
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMap(prev);
      setError("Session expirée. Reconnectez-vous.");
      return;
    }
    const { data, error: upErr } = await supabase
      .from("vendor_availability")
      .upsert(
        { prestataire_id: user.id, date: key, status, note },
        { onConflict: "prestataire_id,date" }
      )
      .select("id, date, status, note")
      .single();
    if (upErr || !data) {
      setMap(prev);
      setError(upErr?.message ?? "Enregistrement impossible.");
      return;
    }
    const row = data as Availability;
    setMap((m) => ({ ...m, [key]: { id: row.id, status: row.status, note: row.note } }));
    router.refresh();
  };

  const setStatus = (status: Status) =>
    apply(selected, status, map[selected]?.note ?? null);

  const saveNote = async () => {
    // Préserve le statut affiché (y compris celui dérivé d'un devis) : une note
    // ne doit pas "débloquer" ni changer l'état du jour.
    await apply(selected, effStatus(selected) ?? "available", noteDraft.trim() || null);
    setEditingNote(false);
  };

  const StatCard = ({
    icon: Icon,
    value,
    label,
    tint,
  }: {
    icon: React.ElementType;
    value: number;
    label: string;
    tint: string;
  }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tint}`}>
        <Icon size={18} />
      </span>
      <div>
        <p className="font-display text-xl font-semibold text-plum">{value}</p>
        <p className="text-xs text-slate">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* En-tête + stats */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Calendrier
          </h1>
          <p className="mt-1 max-w-sm text-sm text-slate">
            Gérez vos disponibilités et vos événements confirmés en cliquant sur
            un jour.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-2xl">
          <StatCard icon={CalendarDays} value={stats.booked} label="Événements confirmés" tint="bg-violet-soft text-violet" />
          <StatCard icon={Clock} value={stats.pending} label="Devis en attente" tint="bg-festif-soft text-festif" />
          <StatCard icon={CheckCircle2} value={stats.available} label="Jours disponibles" tint="bg-emerald-soft text-emerald" />
          <StatCard icon={Lock} value={stats.blocked} label="Jours bloqués" tint="bg-black/5 text-slate" />
        </div>
      </div>

      {/* Corps */}
      <div className="mt-6 grid overflow-hidden rounded-3xl border border-black/5 bg-white lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Calendrier */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-soft text-violet">
                <CalendarDays size={20} />
              </span>
              <h2 className="font-display text-xl font-semibold text-plum">
                {MONTHS[view.month]} {view.year}
              </h2>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => changeMonth(-1)} aria-label="Mois précédent" className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 text-plum hover:bg-cream">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => changeMonth(1)} aria-label="Mois suivant" className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 text-plum hover:bg-cream">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2 text-center">
            {DAYS.map((d, i) => (
              <span key={i} className="pb-1 text-xs font-medium text-slate">
                {d}
              </span>
            ))}
            {cells.map((n, i) => {
              if (n === null) return <div key={`e${i}`} />;
              const key = dateKey(view.year, view.month, n);
              const status = effStatus(key);
              const isSelected = key === selected;
              const isToday = key === todayKey;
              const isBooked = status === "booked";
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-sm transition ${
                    isBooked
                      ? "border-transparent bg-violet font-semibold text-white"
                      : "border-black/5 bg-white text-plum hover:border-violet/40"
                  } ${
                    isSelected
                      ? "ring-2 ring-violet ring-offset-1"
                      : isToday
                      ? "ring-1 ring-violet/30"
                      : ""
                  }`}
                >
                  {n}
                  {status && !isBooked && (
                    <span className={`absolute bottom-2 h-1.5 w-1.5 rounded-full ${DOT[status]}`} />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-black/5 pt-4 text-sm">
            {(["booked", "pending", "available", "blocked"] as Status[]).map((s) => (
              <span key={s} className="inline-flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${DOT[s]}`} />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        {/* Panneau détail */}
        <div className="border-t border-black/5 bg-cream/30 p-6 lg:border-l lg:border-t-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-plum">
              {longDate(selected)}
            </h3>
            <span className="shrink-0 rounded-full bg-violet-soft px-2.5 py-1 text-xs font-semibold text-violet">
              Sélectionné
            </span>
          </div>

          {/* Statut actuel */}
          <p className="mt-5 text-sm font-semibold text-plum">Statut actuel</p>
          <span className={`mt-2 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${PILL[selStatus ?? "available"]}`}>
            <span className={`h-2 w-2 rounded-full ${DOT[selStatus ?? "available"]}`} />
            {STATUS_LABEL[selStatus ?? "available"]}
          </span>

          {/* Événement du jour */}
          <p className="mt-6 text-sm font-semibold text-plum">Événement du jour</p>
          {selEvent ? (
            <Link
              href={`/devis/${selEvent.id}`}
              className="mt-2 flex gap-3 rounded-2xl bg-violet-soft/50 p-4 transition-colors hover:bg-violet-soft"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-violet">
                <CalendarDays size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-medium text-plum">{selEvent.title}</p>
                {selEvent.location && (
                  <p className="text-sm text-slate">{selEvent.location}</p>
                )}
                <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${selEvent.status === "accepté" ? "bg-violet-soft text-violet" : "bg-festif-soft text-festif"}`}>
                  {selEvent.status === "accepté" ? "Événement confirmé" : "Devis en attente"}
                </span>
              </div>
            </Link>
          ) : (
            <p className="mt-2 rounded-2xl border border-dashed border-black/10 px-4 py-4 text-sm text-slate">
              Aucun événement ce jour.
            </p>
          )}

          {/* Notes */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-semibold text-plum">Notes</p>
            {!editingNote && (
              <button type="button" onClick={() => setEditingNote(true)} aria-label="Modifier la note" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-cream hover:text-violet">
                <Pencil size={15} />
              </button>
            )}
          </div>
          {editingNote ? (
            <div className="mt-2">
              <textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                rows={2}
                placeholder="Ajouter une note…"
                className="w-full resize-none rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-plum outline-none focus:border-violet"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={saveNote} className="rounded-lg bg-violet px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-dark">
                  Enregistrer
                </button>
                <button type="button" onClick={() => { setEditingNote(false); setNoteDraft(selNote); }} className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-slate">
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate">
              {selNote || "Aucune note pour cette journée."}
            </p>
          )}

          {/* Actions rapides */}
          <p className="mt-6 text-sm font-semibold text-plum">Actions rapides</p>
          <p className="text-xs text-slate">Modifiez la disponibilité de cette journée.</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setStatus("available")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${selStatus === "available" ? "border-emerald bg-emerald-soft text-emerald" : "border-black/10 text-plum hover:bg-cream"}`}
            >
              <Check size={15} />
              Disponible
            </button>
            <button
              type="button"
              onClick={() => setStatus("blocked")}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-semibold transition-colors ${selStatus === "blocked" ? "border-plum bg-black/5 text-plum" : "border-black/10 text-plum hover:bg-cream"}`}
            >
              <Lock size={15} />
              Bloquer
            </button>
          </div>

          <Link
            href="/pro/demandes?tab=devis"
            className="mt-3 flex items-center justify-between rounded-xl border border-black/10 px-4 py-3 text-sm font-semibold text-plum hover:bg-cream"
          >
            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} className="text-violet" />
              Voir tous les événements
            </span>
            <ChevronRight size={16} className="text-slate" />
          </Link>

          {error && <p className="mt-3 text-sm text-festif">{error}</p>}
        </div>
      </div>
    </div>
  );
}
