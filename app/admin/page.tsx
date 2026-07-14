import Link from "next/link";
import {
  Users,
  PartyPopper,
  Store,
  CalendarDays,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { getProfile, getAdminStats } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { Sparkline, Donut, LineChart } from "@/components/admin/charts";
import ExportButton from "@/components/admin/ExportButton";

export default async function AdminOverview() {
  const [profile, s] = await Promise.all([getProfile(), getAdminStats()]);
  const supabase = createClient();

  // Fenêtre glissante de 7 jours
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const since = new Date(todayMid);
  since.setDate(todayMid.getDate() - 6);
  const sinceISO = since.toISOString();

  const [{ data: profRows }, { data: eventDates }] = await Promise.all([
    supabase.from("profiles").select("role, created_at").gte("created_at", sinceISO),
    // Événements privés : pas de lecture directe. On ne récupère que les
    // horodatages de création (agrégés, sans détail) pour le graphe d'activité.
    supabase.rpc("admin_events_created_since", { p_since: sinceISO }),
  ]);

  // Libellés + répartition par jour
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayMid);
    d.setDate(todayMid.getDate() - (6 - i));
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const bucket = (dates: (string | null | undefined)[]) => {
    const c = Array(7).fill(0) as number[];
    for (const d of dates) {
      if (!d) continue;
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      const idx = 6 - Math.floor((todayMid.getTime() - day.getTime()) / 86_400_000);
      if (idx >= 0 && idx < 7) c[idx] += 1;
    }
    return c;
  };

  const profs = (profRows as { role: string; created_at: string }[]) ?? [];
  const usersSpark = bucket(profs.map((p) => p.created_at));
  const familiesSpark = bucket(profs.filter((p) => p.role === "particulier").map((p) => p.created_at));
  // Cohérence : la carte « Prestataires » compte les COMPTES (role='prestataire'),
  // donc la courbe aussi (pas la table vendors qui inclut les 18 fiches démo).
  const vendorsSpark = bucket(profs.filter((p) => p.role === "prestataire").map((p) => p.created_at));
  const eventsSpark = bucket((eventDates as string[] | null) ?? []);
  const activity = usersSpark.map((v, i) => v + eventsSpark[i]);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  const statCards = [
    { icon: Users, label: "Utilisateurs", value: s.users, sub: `+${sum(usersSpark)} cette semaine`, tint: "bg-violet-soft text-violet", color: "#6C3CE1", spark: usersSpark },
    { icon: PartyPopper, label: "Familles", value: s.families, sub: `+${sum(familiesSpark)} cette semaine`, tint: "bg-festif-soft text-festif", color: "#FF8C42", spark: familiesSpark },
    { icon: Store, label: "Prestataires", value: s.vendors, sub: `${s.pendingVerification} en attente`, tint: "bg-emerald-soft text-emerald", color: "#10B981", spark: vendorsSpark },
    { icon: CalendarDays, label: "Événements", value: s.events, sub: s.events > 0 ? `${s.events} actif${s.events > 1 ? "s" : ""}` : "Aucun événement actif", tint: "bg-violet-soft text-violet", color: "#6C3CE1", spark: eventsSpark },
  ];

  const repTotal = s.families + s.vendors + s.events;
  // Couleurs alignées sur les cartes (Familles=festif, Prestataires=emerald,
  // Événements=violet) pour ne pas dérouter (avant : donut permuté).
  const repartition = [
    { label: "Familles", value: s.families, color: "#FF8C42" },
    { label: "Prestataires", value: s.vendors, color: "#10B981" },
    { label: "Événements", value: s.events, color: "#6C3CE1" },
  ];
  const pct = (v: number) => (repTotal ? Math.round((v / repTotal) * 100) : 0);

  const quick = [
    { icon: Tags, label: "Gérer les catégories", href: "/admin/categories" },
    { icon: Users, label: "Voir les utilisateurs", href: "/admin/utilisateurs" },
    { icon: Store, label: "Voir les prestataires", href: "/admin/prestataires" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Bonjour {profile?.full_name?.trim().split(" ")[0] || "Admin"}
          </h1>
          <p className="mt-1 text-sm text-slate">
            Voici l&apos;activité actuelle de la plateforme Misstice.
          </p>
        </div>
        <ExportButton stats={s} />
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((c) => (
          <div key={c.label} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${c.tint}`}>
                <c.icon size={20} />
              </span>
              <Sparkline points={c.spark} color={c.color} className="mt-1 opacity-80" />
            </div>
            <p className="mt-3 text-sm text-slate">{c.label}</p>
            <p className="font-display text-3xl font-semibold text-plum">
              {c.value.toLocaleString("fr-FR")}
            </p>
            <p className="mt-1 text-xs text-slate">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Activité */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold text-plum">Activité de la plateforme</p>
            <span className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium text-slate">
              7 derniers jours
            </span>
          </div>
          <div className="mt-4">
            <LineChart points={activity} labels={days} />
          </div>
        </div>

        {/* Répartition */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-plum">Répartition</p>
          <div className="mt-4 flex items-center gap-4">
            <Donut segments={repartition} />
            <ul className="flex-1 space-y-2 text-sm">
              {repartition.map((r) => (
                <li key={r.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                    {r.label}
                  </span>
                  <span className="font-semibold text-plum">{pct(r.value)}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Prestataires en attente + Événements + Activité */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Prestataires en attente */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-plum">Prestataires en attente</p>
          {s.pendingVerification > 0 ? (
            <>
              <p className="mt-6 text-center font-display text-4xl font-semibold text-plum">
                {s.pendingVerification}
              </p>
              <p className="mt-1 text-center text-sm text-slate">en attente de vérification</p>
            </>
          ) : (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-soft text-emerald">
                <ShieldCheck size={22} />
              </span>
              <p className="mt-3 text-sm font-semibold text-plum">Aucun prestataire en attente</p>
              <p className="mt-1 text-xs text-slate">Tous les prestataires ont été vérifiés.</p>
            </div>
          )}
          <Link
            href="/admin/prestataires"
            className="mt-4 block rounded-xl bg-violet px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-dark"
          >
            Voir les prestataires
          </Link>
        </div>

        {/* Événements (agrégé — le détail reste privé aux personnes concernées) */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-plum">Événements</p>
          <p className="mt-6 text-center font-display text-4xl font-semibold text-plum">
            {s.events}
          </p>
          <p className="mt-1 text-center text-sm text-slate">
            événement{s.events > 1 ? "s" : ""} sur la plateforme
          </p>
          <p className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-cream px-3 py-2 text-center text-xs text-slate">
            <ShieldCheck size={14} className="shrink-0 text-violet" />
            Contenu privé : visible uniquement des personnes concernées.
          </p>
        </div>

        {/* Actions rapides */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-plum">Actions rapides</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {quick.map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-cream/50 p-4 text-center transition-colors hover:border-violet/30"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-soft text-violet">
                  <q.icon size={17} />
                </span>
                <span className="text-xs font-medium text-plum">{q.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
