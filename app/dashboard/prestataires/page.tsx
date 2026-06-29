"use client";

import { useState } from "react";
import { BadgeCheck, Clock, FileText, Search, Phone } from "lucide-react";

type Status = "Confirmé" | "En attente" | "Devis reçu";
type Booked = {
  name: string;
  cat: string;
  status: Status;
  price: string;
  grad: string;
};

const BOOKED: Booked[] = [
  { name: "Salle Élégance", cat: "Lieu & Salle", status: "Confirmé", price: "4 000 €", grad: "from-violet to-festif" },
  { name: "Saveurs d'Afrique", cat: "Traiteur", status: "Confirmé", price: "4 500 €", grad: "from-emerald to-violet" },
  { name: "DJ Maestro", cat: "Musique & DJ", status: "Confirmé", price: "1 200 €", grad: "from-festif to-emerald" },
  { name: "Studio Lumière", cat: "Photographe", status: "En attente", price: "1 400 €", grad: "from-violet to-emerald" },
  { name: "Pâtisserie Royale", cat: "Gâteau", status: "Devis reçu", price: "600 €", grad: "from-festif to-violet" },
  { name: "Salon Élégance", cat: "Coiffure & Maquillage", status: "Devis reçu", price: "350 €", grad: "from-emerald to-festif" },
];

const STYLE: Record<Status, string> = {
  Confirmé: "bg-emerald-soft text-emerald",
  "En attente": "bg-festif-soft text-festif",
  "Devis reçu": "bg-violet-soft text-violet",
};

const FILTERS = ["Tous", "Confirmé", "En attente", "Devis reçu"];

export default function DashboardVendorsPage() {
  const [filter, setFilter] = useState("Tous");
  const shown = BOOKED.filter((b) => filter === "Tous" || b.status === filter);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Prestataires
          </h1>
          <p className="mt-1 text-sm text-slate">
            {BOOKED.length} prestataires sur votre événement
          </p>
        </div>
        <a
          href="/prestataires"
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Search size={16} />
          Trouver un prestataire
        </a>
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

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((b) => (
          <div key={b.name} className="overflow-hidden rounded-3xl border border-black/5 bg-white">
            <div className={`flex h-28 items-end bg-gradient-to-br ${b.grad} p-4`}>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 font-display text-lg font-semibold text-plum">
                {b.name.charAt(0)}
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold text-plum">{b.name}</p>
                  <p className="text-sm text-slate">{b.cat}</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[b.status]}`}>
                  {b.status === "Confirmé" && <BadgeCheck size={13} />}
                  {b.status === "En attente" && <Clock size={13} />}
                  {b.status === "Devis reçu" && <FileText size={13} />}
                  {b.status}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-4">
                <span className="text-sm font-semibold text-violet">{b.price}</span>
                <button className="inline-flex items-center gap-1.5 rounded-xl border border-plum/15 px-3 py-1.5 text-sm font-semibold text-plum hover:border-plum/30">
                  <Phone size={14} />
                  Contacter
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
