"use client";

import { useState } from "react";
import { CalendarClock, Plus, Phone, Video, X } from "lucide-react";

type Call = {
  id: number;
  vendor: string;
  when: string;
  time: string;
  mode: "Appel" | "Visio";
};

const INITIAL: Call[] = [
  { id: 1, vendor: "Studio Lumière", when: "Demain", time: "14:00", mode: "Appel" },
  { id: 2, vendor: "Salle Élégance", when: "Jeudi", time: "18:00", mode: "Visio" },
  { id: 3, vendor: "DJ Maestro", when: "Lundi", time: "11:00", mode: "Appel" },
];

const VENDORS = [
  "Studio Lumière",
  "Salle Élégance",
  "Saveurs d'Afrique",
  "DJ Maestro",
  "Pâtisserie Royale",
];

export default function AgendaWidget() {
  const [calls, setCalls] = useState<Call[]>(INITIAL);
  const [open, setOpen] = useState(false);
  const [vendor, setVendor] = useState(VENDORS[0]);
  const [when, setWhen] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<"Appel" | "Visio">("Appel");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setCalls((c) => [
      ...c,
      {
        id: Date.now(),
        vendor,
        when: when || "À planifier",
        time: time || "—",
        mode,
      },
    ]);
    setOpen(false);
    setWhen("");
    setTime("");
  };

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-3 py-2 text-sm text-plum outline-none focus:border-violet";

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock size={20} className="text-violet" />
          <h2 className="font-display text-lg font-semibold text-plum">
            Agenda — appels prestataires
          </h2>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-3 py-2 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Plus size={15} />
          Planifier
        </button>
      </div>

      {/* Formulaire de planification */}
      {open && (
        <form
          onSubmit={add}
          className="mt-4 grid gap-3 rounded-2xl bg-cream p-4 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate">Prestataire</label>
            <select
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className={`mt-1 ${inputCls}`}
            >
              {VENDORS.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate">Jour</label>
            <input
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder="ex. Mardi 6 mai"
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate">Heure</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            {(["Appel", "Visio"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
                  mode === m
                    ? "border-violet bg-violet-soft text-violet"
                    : "border-black/10 text-slate"
                }`}
              >
                {m === "Appel" ? <Phone size={14} /> : <Video size={14} />}
                {m}
              </button>
            ))}
            <button
              type="submit"
              className="ml-auto rounded-xl bg-violet px-4 py-2 text-sm font-semibold text-white hover:bg-violet-dark"
            >
              Ajouter
            </button>
          </div>
        </form>
      )}

      {/* Liste des appels */}
      <ul className="mt-4 space-y-2.5">
        {calls.map((c) => (
          <li
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-black/5 p-3"
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                c.mode === "Visio"
                  ? "bg-festif-soft text-festif"
                  : "bg-violet-soft text-violet"
              }`}
            >
              {c.mode === "Visio" ? <Video size={16} /> : <Phone size={16} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-plum">
                {c.vendor}
              </p>
              <p className="text-xs text-slate">
                {c.mode} · {c.when} à {c.time}
              </p>
            </div>
            <button
              aria-label="Annuler l'appel"
              onClick={() => setCalls((list) => list.filter((x) => x.id !== c.id))}
              className="text-slate hover:text-plum"
            >
              <X size={16} />
            </button>
          </li>
        ))}
        {calls.length === 0 && (
          <li className="py-6 text-center text-sm text-slate">
            Aucun appel planifié pour le moment.
          </li>
        )}
      </ul>
    </div>
  );
}
