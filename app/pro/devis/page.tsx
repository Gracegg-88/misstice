"use client";

import { useState } from "react";
import { FileText, CheckCircle2, Clock, XCircle } from "lucide-react";

type Status = "Envoyé" | "Accepté" | "Refusé" | "Expiré";
type Devis = {
  id: number;
  client: string;
  event: string;
  amount: number;
  sent: string;
  status: Status;
};

const DEVIS: Devis[] = [
  { id: 1, client: "Fatou D.", event: "Baptême · 21 sept.", amount: 600, sent: "il y a 2 jours", status: "Envoyé" },
  { id: 2, client: "Christelle N.", event: "Anniversaire · 3 août", amount: 500, sent: "il y a 5 jours", status: "Accepté" },
  { id: 3, client: "Léa & Tom", event: "Mariage · 12 juil.", amount: 1400, sent: "il y a 1 semaine", status: "Accepté" },
  { id: 4, client: "Mehdi B.", event: "Fiançailles · 2 mai", amount: 750, sent: "il y a 2 semaines", status: "Refusé" },
  { id: 5, client: "Aïcha & Sami", event: "Mariage · 9 août", amount: 1600, sent: "il y a 3 semaines", status: "Expiré" },
];

const STYLE: Record<Status, string> = {
  Envoyé: "bg-violet-soft text-violet",
  Accepté: "bg-emerald-soft text-emerald",
  Refusé: "bg-black/5 text-slate",
  Expiré: "bg-festif-soft text-festif",
};

const FILTERS: ("Tous" | Status)[] = ["Tous", "Envoyé", "Accepté", "Refusé", "Expiré"];

export default function ProDevis() {
  const [filter, setFilter] = useState<"Tous" | Status>("Tous");
  const shown = DEVIS.filter((d) => filter === "Tous" || d.status === filter);

  const accepted = DEVIS.filter((d) => d.status === "Accepté");
  const wonValue = accepted.reduce((s, d) => s + d.amount, 0);
  const rate = Math.round((accepted.length / DEVIS.length) * 100);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Mes devis
      </h1>
      <p className="mt-1 text-sm text-slate">{DEVIS.length} devis envoyés</p>

      {/* Résumé */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { l: "Devis acceptés", v: `${accepted.length}/${DEVIS.length}`, icon: CheckCircle2, c: "text-emerald" },
          { l: "Taux de conversion", v: `${rate}%`, icon: Clock, c: "text-violet" },
          { l: "Chiffre gagné", v: `${wonValue.toLocaleString("fr-FR")}€`, icon: FileText, c: "text-plum" },
        ].map((s) => (
          <div key={s.l} className="rounded-3xl border border-black/5 bg-white p-5">
            <s.icon size={20} className={s.c} />
            <p className={`mt-3 font-display text-2xl font-semibold ${s.c}`}>{s.v}</p>
            <p className="mt-1 text-sm text-slate">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-violet text-white" : "bg-white text-slate hover:text-plum"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-black/5 bg-white">
        <ul className="divide-y divide-black/5">
          {shown.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="font-medium text-plum">{d.client}</p>
                <p className="text-xs text-slate">{d.event} · envoyé {d.sent}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display text-lg font-semibold text-plum">
                  {d.amount.toLocaleString("fr-FR")}€
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[d.status]}`}>
                  {d.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
        {shown.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate">Aucun devis pour ce filtre.</p>
        )}
      </div>
    </div>
  );
}
