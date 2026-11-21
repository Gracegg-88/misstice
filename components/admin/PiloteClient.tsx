"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, Sparkles, Clock, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export type PilotMemberRow = {
  id: string;
  company: string;
  pilot_pack_pro_until: string | null;
  founding_member: boolean;
};

export type FoundingMemberRow = {
  id: string;
  company: string;
};

type Settings = {
  pilotQuota: number;
  pilotDurationMonths: number;
  freeTierPhotoLimit: number;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PiloteClient({
  settings,
  pilotMembers,
  foundingMembers,
}: {
  settings: Settings;
  pilotMembers: PilotMemberRow[];
  foundingMembers: FoundingMemberRow[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [extendingId, setExtendingId] = useState<string | null>(null);

  const slotsRemaining = Math.max(0, form.pilotQuota - pilotMembers.length);

  const saveSettings = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("platform_settings")
      .update({
        pilot_quota: form.pilotQuota,
        pilot_duration_months: form.pilotDurationMonths,
        free_tier_photo_limit: form.freeTierPhotoLimit,
      })
      .eq("id", true);
    setSaving(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  };

  // Prolonge le Pack Pro gratuit d'un membre pilote, de pilotDurationMonths à
  // partir d'aujourd'hui (pas cumulatif sur l'ancienne date, pour rester
  // simple et prévisible).
  const extend = async (id: string) => {
    setExtendingId(id);
    setError("");
    const until = new Date();
    until.setMonth(until.getMonth() + form.pilotDurationMonths);
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("vendor_profiles")
      .update({ pilot_pack_pro_until: until.toISOString().slice(0, 10) })
      .eq("id", id);
    setExtendingId(null);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    router.refresh();
  };

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Programme pilote
      </h1>
      <p className="mt-1 text-sm text-slate">
        Pack Pro gratuit offert aux premiers prestataires, et photos
        illimitées pour toujours aux membres fondateurs (comptes créés avant
        PR1).
      </p>

      {error && (
        <p className="mt-4 rounded-2xl bg-garnet-soft px-4 py-3 text-sm font-medium text-garnet">
          {error}
        </p>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-dark">
            <Rocket size={18} />
          </span>
          <div>
            <p className="text-xs text-slate">Places restantes</p>
            <p className="font-display text-xl font-semibold text-plum">
              {slotsRemaining} / {form.pilotQuota}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
            <Clock size={18} />
          </span>
          <div>
            <p className="text-xs text-slate">Membres pilote</p>
            <p className="font-display text-xl font-semibold text-plum">
              {pilotMembers.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-soft text-emerald">
            <Sparkles size={18} />
          </span>
          <div>
            <p className="text-xs text-slate">Membres fondateurs</p>
            <p className="font-display text-xl font-semibold text-plum">
              {foundingMembers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Réglages */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Réglages
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-plum">
              Quota de places pilote
            </label>
            <input
              type="number"
              min={0}
              value={form.pilotQuota}
              onChange={(e) =>
                setForm({ ...form, pilotQuota: Number(e.target.value) || 0 })
              }
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">
              Durée du Pack Pro gratuit (mois)
            </label>
            <input
              type="number"
              min={1}
              value={form.pilotDurationMonths}
              onChange={(e) =>
                setForm({
                  ...form,
                  pilotDurationMonths: Number(e.target.value) || 1,
                })
              }
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">
              Limite de photos (formule gratuite)
            </label>
            <input
              type="number"
              min={1}
              value={form.freeTierPhotoLimit}
              onChange={(e) =>
                setForm({
                  ...form,
                  freeTierPhotoLimit: Number(e.target.value) || 1,
                })
              }
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
          >
            <Check size={16} />
            {saving ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer"}
          </button>
        </div>
      </section>

      {/* Membres pilote */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Membres pilote (Pack Pro gratuit)
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate">
                <th className="pb-2 pr-4">Prestataire</th>
                <th className="pb-2 pr-4">Pack Pro gratuit jusqu&apos;au</th>
                <th className="pb-2 pr-4">Fondateur</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {pilotMembers.map((m) => (
                <tr key={m.id} className="border-t border-black/5">
                  <td className="py-2.5 pr-4 font-medium text-plum">
                    {m.company}
                  </td>
                  <td className="py-2.5 pr-4 text-slate">
                    {formatDate(m.pilot_pack_pro_until)}
                  </td>
                  <td className="py-2.5 pr-4">
                    {m.founding_member && (
                      <span className="rounded-full bg-gold-soft px-2 py-0.5 text-xs font-semibold text-gold-dark">
                        Fondateur
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => extend(m.id)}
                      disabled={extendingId === m.id}
                      className="rounded-lg border border-violet/30 px-3 py-1.5 text-xs font-semibold text-violet hover:bg-violet-soft disabled:opacity-60"
                    >
                      {extendingId === m.id ? "…" : "Prolonger"}
                    </button>
                  </td>
                </tr>
              ))}
              {pilotMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-sm text-slate">
                    Aucun membre pilote pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Membres fondateurs */}
      <section className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Membres fondateurs (photos illimitées, pour toujours)
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {foundingMembers.map((m) => (
            <span
              key={m.id}
              className="rounded-full bg-gold-soft px-3 py-1 text-sm font-medium text-gold-dark"
            >
              {m.company}
            </span>
          ))}
          {foundingMembers.length === 0 && (
            <p className="text-sm text-slate">Aucun membre fondateur pour le moment.</p>
          )}
        </div>
      </section>
    </div>
  );
}
