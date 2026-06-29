import { Eye, Inbox, Clock, Star } from "lucide-react";
import CountUp from "@/components/animations/CountUp";

const months = [
  { m: "Déc", v: 40 },
  { m: "Jan", v: 55 },
  { m: "Fév", v: 48 },
  { m: "Mar", v: 70 },
  { m: "Avr", v: 85 },
  { m: "Mai", v: 100 },
];

export default function ProStats() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Statistiques
      </h1>
      <p className="mt-1 text-sm text-slate">6 derniers mois</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Vues du profil", n: 1240, suffix: "", icon: Eye, c: "text-violet" },
          { l: "Demandes reçues", n: 36, suffix: "", icon: Inbox, c: "text-festif" },
          { l: "Taux de réponse", n: 98, suffix: "%", icon: Clock, c: "text-emerald" },
          { l: "Note moyenne", n: 49, suffix: "", icon: Star, c: "text-plum" },
        ].map((s) => (
          <div key={s.l} className="rounded-3xl border border-black/5 bg-white p-5">
            <s.icon size={20} className={s.c} />
            <p className={`mt-3 font-display text-3xl font-semibold ${s.c}`}>
              {s.l === "Note moyenne" ? (
                <span>4,9</span>
              ) : (
                <CountUp value={s.n} suffix={s.suffix} />
              )}
            </p>
            <p className="mt-1 text-sm text-slate">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-plum">
          Vues du profil par mois
        </h2>
        <div className="mt-6 flex h-48 items-end gap-3">
          {months.map((m) => (
            <div key={m.m} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-violet to-festif"
                  style={{ height: `${m.v}%` }}
                />
              </div>
              <span className="text-xs text-slate">{m.m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
