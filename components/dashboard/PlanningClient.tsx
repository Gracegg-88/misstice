"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarHeart, MapPin, User, Clock, Plus, X, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import Reveal from "@/components/Reveal";
import { createClient } from "@/lib/supabase/client";
import type { PlanningMoment } from "@/lib/dashboard-types";

const PALETTE = ["#6C3CE1", "#FF8C42", "#10B981", "#EC4899", "#3B82F6"];

function sortMoments(list: PlanningMoment[]): PlanningMoment[] {
  return [...list].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;
    return (a.start_time ?? "").localeCompare(b.start_time ?? "");
  });
}

export default function PlanningClient({
  eventId,
  initial,
  eventName,
  eventDate,
}: {
  eventId: string;
  initial: PlanningMoment[];
  eventName: string;
  eventDate: string | null;
}) {
  const router = useRouter();
  const [moments, setMoments] = useState<PlanningMoment[]>(sortMoments(initial));

  const [open, setOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [who, setWho] = useState("");
  const [vendor, setVendor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dateLabel = eventDate
    ? new Date(eventDate).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date à définir";

  const summary = useMemo(() => {
    const withTime = moments.filter((m) => m.start_time);
    const start = withTime[0]?.start_time ?? null;
    const end = withTime[withTime.length - 1]?.start_time ?? null;
    const vendorCount = new Set(
      moments.map((m) => m.vendor).filter((v): v is string => !!v)
    ).size;
    return { start, end, count: moments.length, vendorCount };
  }, [moments]);

  const resetForm = () => {
    setStartTime("");
    setDuration("");
    setTitle("");
    setDescription("");
    setPlace("");
    setWho("");
    setVendor("");
  };

  const addMoment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError("");

    const position = moments.length
      ? Math.max(...moments.map((m) => m.position)) + 1
      : 0;
    const color = PALETTE[position % PALETTE.length];

    const payload = {
      event_id: eventId,
      start_time: startTime.trim() || null,
      duration: duration.trim() || null,
      title: title.trim(),
      description: description.trim() || null,
      place: place.trim() || null,
      who: who.trim() || null,
      vendor: vendor.trim() || null,
      color,
      position,
    };

    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("planning_moments")
      .insert(payload)
      .select("id, event_id, start_time, duration, title, description, place, who, vendor, color, position")
      .single();

    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }

    // Optimiste : ajout immédiat à la liste triée.
    if (data) {
      setMoments((prev) => sortMoments([...prev, data as PlanningMoment]));
    }
    setOpen(false);
    resetForm();
    router.refresh();
  };

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const deleteMoment = async (id: string) => {
    const prev = moments;
    setMoments((list) => list.filter((m) => m.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("planning_moments")
      .delete()
      .eq("id", id);
    if (delErr) {
      setMoments(prev);
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <ConfirmDialog
        open={!!confirmId}
        title="Supprimer ce moment ?"
        message="Ce moment du planning sera définitivement supprimé."
        onConfirm={() => {
          if (confirmId) void deleteMoment(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Planning du Jour J
          </h1>
          <p className="mt-1 text-sm text-slate">
            <span className="capitalize">{dateLabel}</span> · {eventName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Plus size={16} />
          Ajouter un moment
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Timeline */}
        <div className="space-y-3 lg:col-span-2">
          {moments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-sm text-slate">
              Aucun moment pour l&apos;instant. Ajoutez le premier moment de votre
              journée.
            </div>
          )}
          {moments.map((m, i) => (
            <Reveal key={m.id} delay={i * 60}>
              <div
                className="group flex gap-4 rounded-2xl border border-black/5 bg-white p-4"
                style={{ borderLeft: `4px solid ${m.color}` }}
              >
                <div className="w-14 shrink-0 text-right">
                  <p className="font-display text-base font-semibold text-plum">
                    {m.start_time ?? "—"}
                  </p>
                  {m.duration && (
                    <p className="text-xs text-slate">{m.duration}</p>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-plum">{m.title}</p>
                  {m.description && (
                    <p className="text-sm text-slate">{m.description}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate">
                    {m.place && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} />
                        {m.place}
                      </span>
                    )}
                    {m.who && (
                      <span className="inline-flex items-center gap-1">
                        <User size={12} />
                        {m.who}
                      </span>
                    )}
                    {m.vendor && (
                      <span className="rounded-md bg-violet-soft px-2 py-0.5 font-medium text-violet">
                        {m.vendor}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmId(m.id)}
                  aria-label="Supprimer ce moment"
                  className="flex h-8 w-8 shrink-0 items-center justify-center self-start rounded-lg text-slate opacity-100 transition hover:bg-cream hover:text-festif lg:opacity-0 lg:group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Résumé */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border border-black/5 bg-white p-6">
            <div className="flex items-center gap-2">
              <CalendarHeart size={18} className="text-violet" />
              <h2 className="font-display text-lg font-semibold text-plum">
                Résumé du jour J
              </h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Date", dateLabel, true],
                ["Début", summary.start ?? "—", false],
                ["Fin prévue", summary.end ?? "—", false],
                [
                  "Étapes",
                  `${summary.count} moment${summary.count > 1 ? "s" : ""}`,
                  false,
                ],
                [
                  "Prestataires",
                  `${summary.vendorCount} présent${summary.vendorCount > 1 ? "s" : ""}`,
                  false,
                ],
              ].map(([k, v, cap]) => (
                <div
                  key={k as string}
                  className="flex items-center justify-between gap-3 border-b border-black/5 pb-3 last:border-0 last:pb-0"
                >
                  <dt className="text-slate">{k}</dt>
                  <dd
                    className={`text-right font-semibold text-plum ${
                      cap ? "capitalize" : ""
                    }`}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-cream p-3 text-xs text-slate">
              <Clock size={14} className="text-violet" />
              Une journée minutée pour que rien ne soit oublié.
            </div>
          </div>
        </div>
      </div>

      {/* Modale : ajouter un moment */}
      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Ajouter un moment
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={addMoment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-plum">Heure</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-plum">Durée</label>
                  <input
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                    placeholder="ex. 45 min"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-plum">Titre</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. Cérémonie civile"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Description (facultatif)
                </label>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. Mariage civil suivi de la cérémonie laïque"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Lieu (facultatif)
                </label>
                <input
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  placeholder="ex. Mairie du 16e"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-plum">
                    Qui (facultatif)
                  </label>
                  <input
                    value={who}
                    onChange={(e) => setWho(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                    placeholder="ex. Témoins"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-plum">
                    Prestataire (facultatif)
                  </label>
                  <input
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                    placeholder="ex. Studio Lumière"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-festif">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Ajouter le moment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
