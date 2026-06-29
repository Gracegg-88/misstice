import { TrendingUp, Wallet, Users, Store, BadgeCheck } from "lucide-react";
import ChecklistCard from "@/components/dashboard/ChecklistCard";
import AgendaWidget from "@/components/dashboard/AgendaWidget";

const budget = {
  spent: 8750,
  total: 15000,
  lines: [
    { label: "Lieu", value: 3000, color: "#6C3CE1" },
    { label: "Traiteur", value: 2500, color: "#FF8C42" },
    { label: "Photo/Vidéo", value: 1500, color: "#10B981" },
    { label: "Décoration", value: 1000, color: "#EC4899" },
    { label: "DJ", value: 750, color: "#F59E0B" },
  ],
};
const pct = Math.round((budget.spent / budget.total) * 100);

const vendors = [
  { name: "Salle Élégance", cat: "Lieu", status: "Confirmé" },
  { name: "Saveurs d'Afrique", cat: "Traiteur", status: "Confirmé" },
  { name: "Studio Lumière", cat: "Photographe", status: "En attente" },
];

export default function DashboardOverview() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm text-slate">
        Mariage de Sophie &amp; Marc — 15 Juin 2026
      </p>

      {/* Progression globale */}
      <div className="ev-stagger-item mt-4 rounded-3xl border border-black/5 bg-white p-6" style={{ ["--i" as string]: 0 } as React.CSSProperties}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald" />
            <h2 className="font-display text-lg font-semibold text-plum">
              Progression globale
            </h2>
          </div>
          <span className="text-sm font-semibold text-emerald">54%</span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-cream">
          <div className="h-full w-[54%] rounded-full bg-gradient-to-r from-violet to-emerald" />
        </div>
      </div>

      {/* Cartes */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Budget */}
        <div className="ev-stagger-item rounded-3xl border border-black/5 bg-white p-6 lg:col-span-1" style={{ ["--i" as string]: 1 } as React.CSSProperties}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet size={20} className="text-violet" />
              <h2 className="font-display text-lg font-semibold text-plum">
                Budget
              </h2>
            </div>
            <span className="text-sm font-medium text-emerald">
              {pct}% utilisé
            </span>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <div>
              <p className="font-display text-3xl font-semibold text-plum">
                {budget.spent.toLocaleString("fr-FR")}€
              </p>
              <p className="text-sm text-slate">
                sur {budget.total.toLocaleString("fr-FR")}€ prévus
              </p>
            </div>
            {/* Donut en CSS pur */}
            <div
              className="relative ml-auto h-20 w-20 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(#6C3CE1 ${pct}%, #F1ECFD 0)`,
              }}
            >
              <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-sm font-semibold text-plum">
                {pct}%
              </div>
            </div>
          </div>

          <ul className="mt-5 space-y-2">
            {budget.lines.map((l) => (
              <li
                key={l.label}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: l.color }}
                  />
                  {l.label}
                </span>
                <span className="font-medium text-plum">
                  {l.value.toLocaleString("fr-FR")}€
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Invités */}
        <div className="ev-stagger-item rounded-3xl border border-black/5 bg-white p-6" style={{ ["--i" as string]: 2 } as React.CSSProperties}>
          <div className="flex items-center gap-2">
            <Users size={20} className="text-violet" />
            <h2 className="font-display text-lg font-semibold text-plum">
              Invités
            </h2>
          </div>
          <p className="mt-5 font-display text-5xl font-semibold text-plum">
            129
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald" />
                Confirmés
              </span>
              <span className="font-semibold text-plum">87</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate">
                <span className="h-2.5 w-2.5 rounded-full bg-festif" />
                En attente
              </span>
              <span className="font-semibold text-plum">34</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate">
                <span className="h-2.5 w-2.5 rounded-full bg-black/30" />
                Déclinés
              </span>
              <span className="font-semibold text-plum">8</span>
            </li>
          </ul>
        </div>

        {/* Prestataires */}
        <div className="ev-stagger-item rounded-3xl border border-black/5 bg-white p-6" style={{ ["--i" as string]: 3 } as React.CSSProperties}>
          <div className="flex items-center gap-2">
            <Store size={20} className="text-violet" />
            <h2 className="font-display text-lg font-semibold text-plum">
              Prestataires
            </h2>
          </div>
          <ul className="mt-5 space-y-3">
            {vendors.map((v) => (
              <li
                key={v.name}
                className="flex items-center justify-between gap-2"
              >
                <div>
                  <p className="text-sm font-semibold text-plum">{v.name}</p>
                  <p className="text-xs text-slate">{v.cat}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    v.status === "Confirmé"
                      ? "bg-emerald-soft text-emerald"
                      : "bg-festif-soft text-festif"
                  }`}
                >
                  {v.status === "Confirmé" && <BadgeCheck size={13} />}
                  {v.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Checklist + Agenda */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChecklistCard />
        <AgendaWidget />
      </div>
    </div>
  );
}
