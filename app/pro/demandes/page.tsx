"use client";

import { useState } from "react";
import { Calendar, Users, MessageSquare, Check, X, Send } from "lucide-react";

type Status = "Nouvelle" | "Devis envoyé" | "Acceptée" | "Refusée";
type Demande = {
  id: number;
  name: string;
  initials: string;
  event: string;
  date: string;
  guests: number;
  budget: string;
  message: string;
  status: Status;
};

const INITIAL: Demande[] = [
  { id: 1, name: "Awa & Karim", initials: "AK", event: "Mariage", date: "14 juin 2026", guests: 120, budget: "~1 500 €", message: "Bonjour, nous cherchons un photographe pour notre mariage, journée complète. Style reportage naturel. Êtes-vous disponible ?", status: "Nouvelle" },
  { id: 2, name: "Sophie & Marc", initials: "SM", event: "Mariage", date: "15 juin 2026", guests: 130, budget: "~1 400 €", message: "Nous adorons votre book ! Disponible pour le 15 juin ? On aimerait aussi une séance couple.", status: "Nouvelle" },
  { id: 3, name: "Fatou D.", initials: "FD", event: "Baptême", date: "21 sept. 2026", guests: 60, budget: "~600 €", message: "Baptême de notre fils, demi-journée suffit. Merci !", status: "Devis envoyé" },
  { id: 4, name: "Christelle N.", initials: "CN", event: "Anniversaire", date: "3 août 2026", guests: 40, budget: "~500 €", message: "Anniversaire surprise, besoin de 2h de couverture.", status: "Acceptée" },
];

const STYLE: Record<Status, string> = {
  Nouvelle: "bg-festif-soft text-festif",
  "Devis envoyé": "bg-violet-soft text-violet",
  Acceptée: "bg-emerald-soft text-emerald",
  Refusée: "bg-black/5 text-slate",
};

const FILTERS: ("Toutes" | Status)[] = ["Toutes", "Nouvelle", "Devis envoyé", "Acceptée", "Refusée"];

export default function ProDemandes() {
  const [demandes, setDemandes] = useState<Demande[]>(INITIAL);
  const [filter, setFilter] = useState<"Toutes" | Status>("Toutes");
  const [quoteFor, setQuoteFor] = useState<number | null>(null);
  const [amount, setAmount] = useState("");

  const setStatus = (id: number, status: Status) =>
    setDemandes((p) => p.map((d) => (d.id === id ? { ...d, status } : d)));

  const sendQuote = (id: number) => {
    setStatus(id, "Devis envoyé");
    setQuoteFor(null);
    setAmount("");
  };

  const shown = demandes.filter((d) => filter === "Toutes" || d.status === filter);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Demandes de devis
      </h1>
      <p className="mt-1 text-sm text-slate">
        Des familles réelles, avec un événement daté. Répondez vite : votre
        réactivité améliore votre visibilité.
      </p>

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

      <div className="mt-6 space-y-4">
        {shown.map((d) => (
          <div key={d.id} className="rounded-3xl border border-black/5 bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-soft font-semibold text-violet">
                  {d.initials}
                </span>
                <div>
                  <p className="font-display text-lg font-semibold text-plum">{d.name}</p>
                  <p className="text-sm text-slate">{d.event}</p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STYLE[d.status]}`}>
                {d.status}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate">
              <span className="inline-flex items-center gap-1.5"><Calendar size={14} />{d.date}</span>
              <span className="inline-flex items-center gap-1.5"><Users size={14} />{d.guests} invités</span>
              <span className="inline-flex items-center gap-1.5">Budget indicatif : <span className="font-medium text-plum">{d.budget}</span></span>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-cream p-4 text-sm text-plum">
              <MessageSquare size={16} className="mt-0.5 shrink-0 text-violet" />
              {d.message}
            </div>

            {/* Formulaire devis inline */}
            {quoteFor === d.id ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Montant du devis (€)"
                  className="flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                />
                <button
                  onClick={() => sendQuote(d.id)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
                >
                  <Send size={15} />
                  Envoyer le devis
                </button>
                <button
                  onClick={() => setQuoteFor(null)}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-slate"
                >
                  Annuler
                </button>
              </div>
            ) : (
              d.status !== "Refusée" &&
              d.status !== "Acceptée" && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setQuoteFor(d.id);
                      setAmount("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
                  >
                    <Check size={15} />
                    Proposer un devis
                  </button>
                  <button
                    onClick={() => setStatus(d.id, "Refusée")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-slate hover:border-plum/30 hover:text-plum"
                  >
                    <X size={15} />
                    Décliner
                  </button>
                </div>
              )
            )}
          </div>
        ))}
        {shown.length === 0 && (
          <p className="rounded-3xl border border-dashed border-black/10 bg-white py-12 text-center text-sm text-slate">
            Aucune demande pour ce filtre.
          </p>
        )}
      </div>
    </div>
  );
}
