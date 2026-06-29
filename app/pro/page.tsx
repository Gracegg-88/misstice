import {
  Inbox,
  FileText,
  Clock,
  TrendingUp,
  ShieldCheck,
  Scale,
  Phone,
  Video,
  ArrowRight,
} from "lucide-react";
import CountUp from "@/components/animations/CountUp";

const recent = [
  { name: "Awa & Karim", event: "Mariage", date: "14 juin 2026", guests: 120, status: "Nouvelle" },
  { name: "Sophie & Marc", event: "Mariage", date: "15 juin 2026", guests: 130, status: "Nouvelle" },
  { name: "Fatou D.", event: "Baptême", date: "21 sept. 2026", guests: 60, status: "Devis envoyé" },
];

const calls = [
  { who: "Awa & Karim", when: "Demain · 14:00", mode: "Appel" },
  { who: "Sophie & Marc", when: "Jeudi · 18:00", mode: "Visio" },
];

export default function ProOverview() {
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm text-slate">Bonjour Studio Lumière 👋</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Tableau de bord
      </h1>

      {/* Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Demandes ce mois", n: 8, icon: Inbox, suffix: "", c: "text-violet" },
          { l: "Devis en attente", n: 3, icon: FileText, suffix: "", c: "text-festif" },
          { l: "Taux de réponse", n: 98, icon: Clock, suffix: "%", c: "text-emerald" },
          { l: "Revenu estimé", n: 4200, icon: TrendingUp, suffix: "€", c: "text-plum" },
        ].map((s, i) => (
          <div
            key={s.l}
            className="ev-stagger-item rounded-3xl border border-black/5 bg-white p-5"
            style={{ ["--i" as string]: i } as React.CSSProperties}
          >
            <s.icon size={20} className={s.c} />
            <p className={`mt-3 font-display text-3xl font-semibold ${s.c}`}>
              <CountUp value={s.n} suffix={s.suffix} />
            </p>
            <p className="mt-1 text-sm text-slate">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Demandes récentes */}
        <div className="rounded-3xl border border-black/5 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox size={20} className="text-violet" />
              <h2 className="font-display text-lg font-semibold text-plum">
                Demandes récentes
              </h2>
            </div>
            <a href="/pro/demandes" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
              Tout voir <ArrowRight size={15} />
            </a>
          </div>
          <ul className="mt-4 divide-y divide-black/5">
            {recent.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-plum">{r.name}</p>
                  <p className="text-xs text-slate">
                    {r.event} · {r.date} · {r.guests} invités
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.status === "Nouvelle"
                      ? "bg-festif-soft text-festif"
                      : "bg-violet-soft text-violet"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prochains rendez-vous */}
        <div className="rounded-3xl border border-black/5 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-plum">
            Prochains rendez-vous
          </h2>
          <ul className="mt-4 space-y-2.5">
            {calls.map((c) => (
              <li key={c.who} className="flex items-center gap-3 rounded-2xl border border-black/5 p-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    c.mode === "Visio" ? "bg-festif-soft text-festif" : "bg-violet-soft text-violet"
                  }`}
                >
                  {c.mode === "Visio" ? <Video size={16} /> : <Phone size={16} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-plum">{c.who}</p>
                  <p className="text-xs text-slate">{c.mode} · {c.when}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Réassurance pro (cohérent avec la promesse Misstice) */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald/15 bg-emerald-soft p-4">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-emerald" />
          <p className="text-sm text-plum">
            <span className="font-semibold">Demandes qualifiées, zéro faux lead.</span>{" "}
            Chaque demande vient d&apos;une famille réelle avec un événement daté.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-violet/15 bg-violet-soft p-4">
          <Scale size={20} className="mt-0.5 shrink-0 text-violet" />
          <p className="text-sm text-plum">
            <span className="font-semibold">Classement au mérite.</span>{" "}
            Votre visibilité dépend de vos avis et de votre réactivité, jamais
            d&apos;un abonnement.
          </p>
        </div>
      </div>
    </div>
  );
}
