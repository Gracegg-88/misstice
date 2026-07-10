import Link from "next/link";
import {
  Wallet,
  Users,
  Store,
  BadgeCheck,
  PartyPopper,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import ChecklistCard from "@/components/dashboard/ChecklistCard";
import { getCurrentEvent, getBudgetCategories, getProfile } from "@/lib/queries";
import { getChecklist, getEventVendors, getGuests } from "@/lib/dashboard";

const eur = (n: number) => n.toLocaleString("fr-FR") + "€";

export default async function DashboardOverview() {
  const event = await getCurrentEvent();

  // Pas encore d'événement : on invite à en créer un.
  if (!event) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-soft text-violet">
          <PartyPopper size={26} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold text-plum">
          Aucun événement pour l&apos;instant
        </h1>
        <p className="mt-2 text-slate">
          Créez votre premier événement pour retrouver ici votre budget, vos
          invités et votre équipe.
        </p>
        <Link
          href="/dashboard/nouveau"
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <PartyPopper size={17} />
          Créer un événement
        </Link>
      </div>
    );
  }

  const cats = await getBudgetCategories(event.id);
  const [tasks, bookedVendors, guests, profile] = await Promise.all([
    getChecklist(event.id),
    getEventVendors(event.id),
    getGuests(event.id),
    getProfile(),
  ]);
  const guestsConfirmed = guests.filter((g) => g.status === "confirmé").length;
  const guestsPending = guests.filter(
    (g) => g.status === "invité" || g.status === "en attente"
  ).length;
  const spent = cats.reduce((s, c) => s + Number(c.spent), 0);
  const total = Number(event.budget_total) || cats.reduce((s, c) => s + Number(c.budget), 0);
  const pct = total ? Math.round((spent / total) * 100) : 0;

  // Progression globale = avancement de la checklist.
  const doneTasks = tasks.filter((t) => t.done).length;
  const progress = tasks.length
    ? Math.round((doneTasks / tasks.length) * 100)
    : 0;

  // Top 5 des catégories où de l'argent a été dépensé.
  const lines = [...cats]
    .filter((c) => Number(c.spent) > 0)
    .sort((a, b) => Number(b.spent) - Number(a.spent))
    .slice(0, 5);

  const dateLabel = event.event_date
    ? new Date(event.event_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date à définir";

  // ── Alertes contextuelles (in-app, basées sur l'événement) ────────────────
  const firstName = (profile?.full_name ?? "").trim().split(" ")[0] || "";
  const hey = firstName ? ` ${firstName}` : "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const evDate = event.event_date
    ? new Date(event.event_date + "T00:00:00")
    : null;
  const daysToEvent = evDate
    ? Math.ceil((evDate.getTime() - today.getTime()) / 86_400_000)
    : null;
  const overdue = tasks.filter(
    (t) => !t.done && t.due_date && new Date(t.due_date + "T00:00:00") < today
  ).length;

  type Alert = { level: "critical" | "warning" | "info"; text: string; href: string };
  const alerts: Alert[] = [];

  if (total > 0 && pct >= 100) {
    alerts.push({
      level: "critical",
      text: `Attention${hey}, votre budget est dépassé (${eur(spent)} / ${eur(total)}). Ajustez vos dépenses ou revoyez le budget prévu.`,
      href: "/dashboard/budget",
    });
  } else if (total > 0 && pct >= 85) {
    alerts.push({
      level: "warning",
      text: `Attention${hey}, votre budget est presque épuisé (${pct}% utilisés).`,
      href: "/dashboard/budget",
    });
  }

  if (daysToEvent != null && daysToEvent >= 0 && daysToEvent <= 7) {
    alerts.push({
      level: daysToEvent <= 2 ? "warning" : "info",
      text:
        `Plus que ${daysToEvent} jour${daysToEvent > 1 ? "s" : ""} avant « ${event.name} »` +
        (progress < 100 ? ` — il reste ${tasks.length - doneTasks} tâche${tasks.length - doneTasks > 1 ? "s" : ""}.` : " 🎉"),
      href: "/dashboard/checklist",
    });
  } else if (
    daysToEvent != null &&
    daysToEvent > 7 &&
    daysToEvent <= 45 &&
    bookedVendors.length === 0
  ) {
    alerts.push({
      level: "info",
      text: `« ${event.name} » approche (${daysToEvent} j) et aucun prestataire n'est réservé.`,
      href: "/dashboard/prestataires",
    });
  }

  if (
    daysToEvent != null &&
    daysToEvent >= 0 &&
    daysToEvent <= 14 &&
    guestsPending > 0
  ) {
    alerts.push({
      level: "info",
      text: `${guestsPending} invité${guestsPending > 1 ? "s" : ""} n'${guestsPending > 1 ? "ont" : "a"} pas encore répondu, à ${daysToEvent} j de l'événement.`,
      href: "/dashboard/invites",
    });
  }

  if (overdue > 0) {
    alerts.push({
      level: "warning",
      text: `Vous avez ${overdue} tâche${overdue > 1 ? "s" : ""} en retard dans votre checklist.`,
      href: "/dashboard/checklist",
    });
  }

  const alertStyle: Record<Alert["level"], string> = {
    critical: "border-festif/30 bg-festif-soft text-festif",
    warning: "border-festif/20 bg-festif-soft/60 text-festif",
    info: "border-violet/20 bg-violet-soft/60 text-plum",
  };
  const shown = alerts.slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate">
          {event.name} — {dateLabel}
        </p>
        <Link
          href="/dashboard/nouveau"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-plum transition-colors hover:bg-cream"
        >
          <PartyPopper size={15} />
          Nouvel événement
        </Link>
      </div>

      {/* Alertes contextuelles */}
      {shown.length > 0 && (
        <div className="mt-4 space-y-2">
          {shown.map((a, i) => (
            <Link
              key={i}
              href={a.href}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-opacity hover:opacity-90 ${alertStyle[a.level]}`}
            >
              <AlertTriangle size={18} className="shrink-0" />
              <span className="flex-1">{a.text}</span>
              <ArrowRight size={16} className="shrink-0 opacity-70" />
            </Link>
          ))}
        </div>
      )}

      {/* Progression globale (checklist) */}
      <div className="mt-4 rounded-3xl border border-black/5 bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-plum">
            Progression globale
          </span>
          <span className="text-sm font-medium text-emerald">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full bg-emerald transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate">
          {doneTasks} / {tasks.length} tâche{tasks.length > 1 ? "s" : ""} de la
          checklist terminée{doneTasks > 1 ? "s" : ""}
        </p>
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
                {eur(spent)}
              </p>
              <p className="text-sm text-slate">
                sur {eur(total)} prévus
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
            {lines.length === 0 && (
              <li className="text-sm text-slate">
                Aucune dépense enregistrée pour l&apos;instant.
              </li>
            )}
            {lines.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-slate">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: l.color }}
                  />
                  {l.name}
                </span>
                <span className="font-medium text-plum">
                  {eur(Number(l.spent))}
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
            {guests.length}
          </p>
          <p className="mt-1 text-sm text-slate">
            invité{guests.length > 1 ? "s" : ""} enregistré
            {guests.length > 1 ? "s" : ""}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-semibold text-emerald">
              {guestsConfirmed} confirmé{guestsConfirmed > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-festif-soft px-2.5 py-1 text-xs font-semibold text-festif">
              {guestsPending} en attente
            </span>
          </div>
          <Link
            href="/dashboard/invites"
            className="mt-4 inline-block text-sm font-semibold text-violet hover:text-violet-dark"
          >
            Gérer les invités
          </Link>
        </div>

        {/* Prestataires */}
        <div className="ev-stagger-item rounded-3xl border border-black/5 bg-white p-6" style={{ ["--i" as string]: 3 } as React.CSSProperties}>
          <div className="flex items-center gap-2">
            <Store size={20} className="text-violet" />
            <h2 className="font-display text-lg font-semibold text-plum">
              Prestataires
            </h2>
          </div>
          {bookedVendors.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-black/10 px-4 py-6 text-center text-sm text-slate">
              Aucun prestataire réservé.{" "}
              <Link href="/dashboard/prestataires" className="font-semibold text-violet">
                En ajouter
              </Link>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {bookedVendors.slice(0, 5).map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-plum">{v.name}</p>
                    <p className="text-xs text-slate">{v.category ?? "—"}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      v.status === "confirmé"
                        ? "bg-emerald-soft text-emerald"
                        : "bg-festif-soft text-festif"
                    }`}
                  >
                    {v.status === "confirmé" && <BadgeCheck size={13} />}
                    {v.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Checklist */}
      <div className="mt-6">
        <ChecklistCard key={event.id} eventId={event.id} initial={tasks} />
      </div>
    </div>
  );
}
