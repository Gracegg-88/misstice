"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Heart, Cake, Baby, GlassWater, Gift, PartyPopper } from "lucide-react";

const EVENT_TYPES = [
  { label: "Mariage", icon: Heart },
  { label: "Anniversaire", icon: Cake },
  { label: "Baptême", icon: Baby },
  { label: "Gala / soirée", icon: GlassWater },
  { label: "Autre", icon: Gift },
];

const inputCls =
  "w-full rounded-xl border border-black/10 bg-cream px-4 py-2 text-sm text-plum outline-none focus:border-violet";

export default function NouvelEvenementPage() {
  const router = useRouter();
  const [type, setType] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [dress, setDress] = useState("");
  const [budget, setBudget] = useState("");
  const [guests, setGuests] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = type !== "" && name.trim() !== "";

  const create = async () => {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth?next=/dashboard/nouveau");
      return;
    }

    // La création de l'événement déclenche le trigger qui génère
    // automatiquement les catégories de budget.
    const { error: evErr } = await supabase.from("events").insert({
      owner_id: user.id,
      name: name.trim(),
      type: type || null,
      event_date: date || null,
      event_time: time.trim() || null,
      location: location.trim() || null,
      dress_code: dress.trim() || null,
      budget_total: budget ? Number(budget) : 0,
      guest_count: guests ? Number(guests) : 0,
    });

    if (evErr) {
      setLoading(false);
      setError(evErr.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-plum">
        Nouvel événement
      </h1>
      <p className="mt-0.5 text-sm text-slate">
        Quelques infos pour démarrer. Tout reste modifiable ensuite.
      </p>

      <div className="mt-3 rounded-3xl border border-black/5 bg-white p-4 shadow-sm sm:p-5">
        {/* Type */}
        <p className="text-sm font-medium text-plum">Quel type d&apos;événement ?</p>
        <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {EVENT_TYPES.map((t) => {
            const on = type === t.label;
            return (
              <button
                key={t.label}
                type="button"
                onClick={() => setType(t.label)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-2.5 transition-colors ${
                  on
                    ? "border-violet bg-violet-soft text-violet"
                    : "border-black/10 bg-cream text-slate hover:border-violet/40"
                }`}
              >
                <t.icon size={18} />
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nom + date */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-plum">
              Nom de l&apos;événement
            </label>
            <input
              placeholder="ex. Mariage de Sophie & Marc"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">Date</label>
            <input
              type="date"
              aria-label="Date de l'événement"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
        </div>

        {/* Heure + lieu */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-plum">Heure</label>
            <input
              type="time"
              aria-label="Heure de l'événement"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">Lieu</label>
            <input
              placeholder="ex. Villa Rose, Cotonou"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
        </div>

        {/* Tenue */}
        <div className="mt-3">
          <label className="text-sm font-medium text-plum">
            Tenue / code vestimentaire (optionnel)
          </label>
          <input
            placeholder="ex. Chic décontractée"
            value={dress}
            onChange={(e) => setDress(e.target.value)}
            className={`mt-1 ${inputCls}`}
          />
        </div>

        {/* Budget + invités */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-plum">
              Budget prévisionnel (€)
            </label>
            <input
              type="number"
              min={0}
              placeholder="ex. 15000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">
              Nombre d&apos;invités
            </label>
            <input
              type="number"
              min={0}
              placeholder="ex. 120"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className={`mt-1 ${inputCls}`}
            />
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-xl bg-festif-soft px-4 py-2.5 text-sm text-festif">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={create}
          disabled={loading || !canSubmit}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
        >
          <PartyPopper size={17} />
          {loading ? "Création…" : "Créer l'événement"}
        </button>
      </div>
    </div>
  );
}
