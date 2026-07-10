"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Armchair, Plus, X, Trash2, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SeatingTable, SeatingSeat } from "@/lib/dashboard-types";
import ReadOnlyBanner from "@/components/dashboard/ReadOnlyBanner";

export default function SeatingClient({
  eventId,
  eventName,
  initialTables,
  initialSeats,
  guestNames,
  canEdit = true,
}: {
  eventId: string;
  eventName: string;
  initialTables: SeatingTable[];
  initialSeats: SeatingSeat[];
  guestNames: string[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [tables, setTables] = useState<SeatingTable[]>(initialTables);
  const [seats, setSeats] = useState<SeatingSeat[]>(initialSeats);
  const [newTable, setNewTable] = useState({ name: "", capacity: "8" });
  const [seatDraft, setSeatDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const seatsOf = (tableId: string) =>
    seats.filter((s) => s.table_id === tableId);
  const placedCount = seats.length;
  const assignedNames = new Set(seats.map((s) => s.name.toLowerCase()));

  const addTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const name = newTable.name.trim();
    if (!name) return;
    setError("");
    const supabase = createClient();
    const position =
      tables.reduce((m, t) => Math.max(m, t.position), 0) + 1;
    const { data, error: insErr } = await supabase
      .from("seating_tables")
      .insert({
        event_id: eventId,
        name,
        capacity: Math.max(1, Number(newTable.capacity) || 8),
        position,
      })
      .select("id, event_id, name, capacity, position")
      .single();
    if (insErr || !data) {
      setError(insErr?.message ?? "Erreur lors de l'ajout de la table.");
      return;
    }
    setTables((p) => [...p, data as SeatingTable]);
    setNewTable({ name: "", capacity: "8" });
    router.refresh();
  };

  const deleteTable = async (id: string) => {
    if (!canEdit) return;
    const prevT = tables;
    const prevS = seats;
    setTables((p) => p.filter((t) => t.id !== id));
    setSeats((p) => p.filter((s) => s.table_id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("seating_tables")
      .delete()
      .eq("id", id);
    if (delErr) {
      setTables(prevT);
      setSeats(prevS);
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  const addSeat = async (tableId: string) => {
    if (!canEdit) return;
    const name = (seatDraft[tableId] ?? "").trim();
    if (!name) return;
    setError("");
    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("seating_seats")
      .insert({ event_id: eventId, table_id: tableId, name })
      .select("id, event_id, table_id, name, position")
      .single();
    if (insErr || !data) {
      setError(insErr?.message ?? "Erreur lors du placement.");
      return;
    }
    setSeats((p) => [...p, data as SeatingSeat]);
    setSeatDraft((d) => ({ ...d, [tableId]: "" }));
    router.refresh();
  };

  const removeSeat = async (id: string) => {
    if (!canEdit) return;
    const prev = seats;
    setSeats((p) => p.filter((s) => s.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("seating_seats")
      .delete()
      .eq("id", id);
    if (delErr) {
      setSeats(prev);
      return;
    }
    router.refresh();
  };

  // Invités pas encore placés (pour le datalist).
  const unplaced = guestNames.filter(
    (n) => !assignedNames.has(n.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-5xl">
      <datalist id="guest-names">
        {unplaced.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
          Plan de table
        </h1>
        <p className="mt-1 text-sm text-slate">
          {tables.length} table{tables.length > 1 ? "s" : ""} · {placedCount} invité
          {placedCount > 1 ? "s" : ""} placé{placedCount > 1 ? "s" : ""} · {eventName}
        </p>
      </div>
      {!canEdit && (
        <div className="mt-5">
          <ReadOnlyBanner section="le plan de table" />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-festif">{error}</p>}

      {/* Ajouter une table */}
      {canEdit && (
        <form
          onSubmit={addTable}
          className="mt-6 flex flex-col gap-3 rounded-2xl bg-white p-4 sm:flex-row sm:items-center"
        >
          <input
            value={newTable.name}
            onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
            placeholder="Nom de la table (ex. Table des mariés)"
            className="flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate">Places</label>
            <input
              type="number"
              min={1}
              value={newTable.capacity}
              onChange={(e) =>
                setNewTable({ ...newTable, capacity: e.target.value })
              }
              aria-label="Nombre de places"
              className="w-20 rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-right text-sm outline-none focus:border-violet"
            />
          </div>
          <button
            type="submit"
            disabled={!newTable.name.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-50"
          >
            <Plus size={16} />
            Ajouter la table
          </button>
        </form>
      )}

      {/* Grille des tables */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.length === 0 && (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center sm:col-span-2 lg:col-span-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
              <Armchair size={22} />
            </div>
            <p className="mt-3 font-display text-base font-semibold text-plum">
              Aucune table
            </p>
            <p className="mt-1 text-sm text-slate">
              Créez vos tables puis placez-y vos invités.
            </p>
          </div>
        )}
        {tables.map((t) => {
          const list = seatsOf(t.id);
          const over = list.length > t.capacity;
          return (
            <div
              key={t.id}
              className="flex flex-col rounded-3xl border border-black/5 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-plum">
                    {t.name}
                  </p>
                  <p
                    className={`text-xs ${
                      over ? "font-semibold text-festif" : "text-slate"
                    }`}
                  >
                    {list.length} / {t.capacity} place{t.capacity > 1 ? "s" : ""}
                    {over ? " · complet !" : ""}
                  </p>
                </div>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => deleteTable(t.id)}
                    aria-label={`Supprimer ${t.name}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate hover:bg-cream hover:text-festif"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>

              <ul className="mt-3 flex-1 space-y-1.5">
                {list.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-cream px-3 py-1.5 text-sm text-plum"
                  >
                    <span className="truncate">{s.name}</span>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => removeSeat(s.id)}
                        aria-label={`Retirer ${s.name}`}
                        className="shrink-0 text-slate hover:text-festif"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </li>
                ))}
                {list.length === 0 && (
                  <li className="rounded-lg border border-dashed border-black/10 px-3 py-2 text-center text-xs text-slate">
                    Personne à cette table.
                  </li>
                )}
              </ul>

              {canEdit && (
                <div className="mt-3 flex gap-1.5">
                  <input
                    list="guest-names"
                    value={seatDraft[t.id] ?? ""}
                    onChange={(e) =>
                      setSeatDraft((d) => ({ ...d, [t.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void addSeat(t.id);
                      }
                    }}
                    placeholder="Ajouter un invité…"
                    className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-violet"
                  />
                  <button
                    type="button"
                    onClick={() => addSeat(t.id)}
                    aria-label="Placer à cette table"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet text-white hover:bg-violet-dark"
                  >
                    <UserPlus size={15} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
