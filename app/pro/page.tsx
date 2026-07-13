import Link from "next/link";
import {
  Inbox,
  FileText,
  BadgeCheck,
  TrendingUp,
  Eye,
  MessageSquare,
  Store,
  CalendarDays,
} from "lucide-react";
import { getMyVendor, getProStats, getMyQuotes } from "@/lib/pro";
import { getMyConversations } from "@/lib/messaging";
import { createClient } from "@/lib/supabase/server";
import { Sparkline, Donut, LineChart } from "@/components/admin/charts";

const QUOTE_BADGE: Record<string, string> = {
  accepté: "bg-emerald-soft text-emerald",
  envoyé: "bg-violet-soft text-violet",
  refusé: "bg-festif-soft text-festif",
  expiré: "bg-cream text-slate",
};

export default async function ProOverviewPage() {
  const [vendor, stats, conversations, quotes] = await Promise.all([
    getMyVendor(),
    getProStats(),
    getMyConversations(),
    getMyQuotes(),
  ]);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const uid = user?.id ?? "";

  // Fenêtre glissante de 7 jours.
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const since = new Date(todayMid);
  since.setDate(todayMid.getDate() - 6);
  const sinceISO = since.toISOString();

  const [{ data: convRows }, { data: quoteRows }, viewRes] = await Promise.all([
    supabase
      .from("conversations")
      .select("created_at")
      .eq("prestataire_id", uid)
      .not("demande", "is", null)
      .gte("created_at", sinceISO),
    supabase
      .from("quotes")
      .select("created_at, status, amount")
      .eq("prestataire_id", uid)
      .gte("created_at", sinceISO),
    vendor?.vendorId
      ? supabase
          .from("profile_views")
          .select("viewed_at")
          .eq("vendor_id", vendor.vendorId)
          .gte("viewed_at", sinceISO)
      : Promise.resolve({ data: [] as { viewed_at: string }[] }),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayMid);
    d.setDate(todayMid.getDate() - (6 - i));
    return `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}`;
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

  const demandesSpark = bucket(
    ((convRows as { created_at: string }[]) ?? []).map((r) => r.created_at)
  );
  const qs =
    (quoteRows as { created_at: string; status: string; amount: number }[]) ?? [];
  const devisSpark = bucket(qs.map((q) => q.created_at));
  const acceptSpark = bucket(
    qs.filter((q) => q.status === "accepté").map((q) => q.created_at)
  );
  // Revenu par jour = SOMME des montants des devis acceptés (pas un simple compte).
  const revenueSpark = (() => {
    const c = Array(7).fill(0) as number[];
    for (const q of qs) {
      if (q.status !== "accepté") continue;
      const day = new Date(q.created_at);
      day.setHours(0, 0, 0, 0);
      const idx =
        6 - Math.floor((todayMid.getTime() - day.getTime()) / 86_400_000);
      if (idx >= 0 && idx < 7) c[idx] += Number(q.amount) || 0;
    }
    return c;
  })();
  const viewsSpark = bucket(
    ((viewRes.data as { viewed_at: string }[]) ?? []).map((v) => v.viewed_at)
  );
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  const statCards = [
    { icon: Inbox, label: "Demandes reçues", value: stats.demandes, sub: `+${sum(demandesSpark)} cette semaine`, tint: "bg-violet-soft text-violet", color: "#6C3CE1", spark: demandesSpark },
    { icon: FileText, label: "Devis envoyés", value: stats.quotesSent, sub: `+${sum(devisSpark)} cette semaine`, tint: "bg-festif-soft text-festif", color: "#FF8C42", spark: devisSpark },
    { icon: BadgeCheck, label: "Devis acceptés", value: stats.quotesAccepted, sub: `${stats.quotesSent ? Math.round((stats.quotesAccepted / stats.quotesSent) * 100) : 0}% de conversion`, tint: "bg-emerald-soft text-emerald", color: "#10B981", spark: acceptSpark },
    { icon: TrendingUp, label: "Revenu estimé", value: stats.revenue, sub: "Devis acceptés", tint: "bg-violet-soft text-violet", color: "#6C3CE1", spark: revenueSpark, euro: true },
  ];

  // Répartition des devis par statut.
  const byStatus = (s: string) => quotes.filter((q) => q.status === s).length;
  const repartition = [
    { label: "Acceptés", value: byStatus("accepté"), color: "#10B981" },
    { label: "Envoyés", value: byStatus("envoyé"), color: "#6C3CE1" },
    { label: "Refusés", value: byStatus("refusé") + byStatus("expiré"), color: "#FF8C42" },
  ];
  const repTotal = repartition.reduce((s, r) => s + r.value, 0);
  const pct = (v: number) => (repTotal ? Math.round((v / repTotal) * 100) : 0);

  const recent = conversations
    .filter((c) => c.role === "prestataire")
    .slice(0, 3);
  const recentQuotes = quotes.slice(0, 4);

  const quick = [
    { icon: MessageSquare, label: "Ma messagerie", href: "/pro/messagerie" },
    { icon: FileText, label: "Mes devis", href: "/pro/devis" },
    { icon: Store, label: "Mon profil", href: "/pro/profil" },
    { icon: CalendarDays, label: "Mon calendrier", href: "/pro/calendrier" },
  ];

  // ── Complétion du profil (le bandeau persiste jusqu'à 100 %) ──────────────
  const name = (vendor?.company ?? "").trim() || "vous";
  const checklist = [
    { label: "votre métier", ok: !!vendor?.category },
    { label: "votre ville", ok: !!vendor?.city },
    { label: "une accroche", ok: !!vendor?.tagline },
    { label: "votre présentation", ok: !!vendor?.about },
    { label: "un tarif de départ", ok: !!vendor?.priceFrom },
    { label: "une photo de profil", ok: !!vendor?.image },
  ];
  const doneCount = checklist.filter((f) => f.ok).length;
  const completion = Math.round((doneCount / checklist.length) * 100);
  const missing = checklist.filter((f) => !f.ok).map((f) => f.label);

  // Signaux contextuels (vraies données) pour un nudge actionnable.
  const quoteConvIds = new Set(
    quotes.map((q) => q.conversation_id).filter(Boolean)
  );
  const proConvs = conversations.filter((c) => c.role === "prestataire");
  // Demandes (avec `demande`) qui n'ont pas encore reçu de devis.
  const pendingDemandes = proConvs.filter(
    (c) => c.demande != null && !quoteConvIds.has(c.id)
  ).length;
  // Devis envoyés en attente de réponse du client.
  const pendingQuotes = quotes.filter((q) => q.status === "envoyé").length;

  // Messages génériques (repli) qui varient chaque jour.
  const tips = [
    `${name}, une fiche complète reçoit bien plus de demandes — pensez à la peaufiner.`,
    `Un book à jour, ${name}, c'est le meilleur moyen de montrer votre talent.`,
    `${name}, répondez vite aux demandes : les familles adorent la réactivité.`,
    `Ajoutez quelques réalisations récentes, ${name} — on veut voir votre style.`,
    `${name}, une belle accroche donne envie de vous contacter. La vôtre est-elle à jour ?`,
    `Un tarif clair rassure, ${name}. Vérifiez votre « à partir de ».`,
  ];
  const dayOfYear = Math.floor(
    (todayMid.getTime() - new Date(todayMid.getFullYear(), 0, 0).getTime()) /
      86_400_000
  );

  // Priorité : action urgente > profil incomplet > relance > astuce du jour.
  const tip =
    pendingDemandes > 0
      ? `${name}, vous avez ${pendingDemandes} demande${pendingDemandes > 1 ? "s" : ""} sans devis — répondez vite pour ne pas ${pendingDemandes > 1 ? "les" : "la"} perdre.`
      : completion < 100
        ? `${name}, complétez votre profil (${completion}%) : une fiche complète reçoit bien plus de demandes.`
        : pendingQuotes > 0
          ? `${name}, ${pendingQuotes} devis en attente de réponse. Une relance amicale peut faire la différence.`
          : tips[dayOfYear % tips.length];

  return (
    <div className="mx-auto max-w-6xl">
      {/* En-tête */}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Bonjour {vendor?.company ?? "et bienvenue"}
      </h1>
      {/* Nudge personnalisé du jour (voix de la plateforme). */}
      <p className="mt-1 flex items-center gap-2 text-sm text-slate">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
        {tip}
      </p>

      {/* Bandeau de complétion — persiste tant que le profil n'est pas complet. */}
      {completion < 100 && (
        <div className="mt-5 rounded-3xl border border-violet/20 bg-violet-soft/50 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Store size={18} className="text-violet" />
              <p className="font-display text-lg font-semibold text-plum">
                Complétez votre profil
              </p>
            </div>
            <span className="font-display text-2xl font-semibold text-violet">
              {completion}%
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet to-festif transition-all"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate">
            Il vous reste à ajouter&nbsp;: {missing.join(", ")}. Une fiche complète
            inspire confiance et reçoit plus de demandes.
          </p>
          <Link
            href="/pro/profil"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            <Store size={16} />
            Compléter mon profil
          </Link>
        </div>
      )}

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
              {c.euro ? "€" : ""}
            </p>
            <p className="mt-1 text-xs text-slate">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* Activité — vues de la fiche */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={18} className="text-violet" />
              <p className="font-display text-lg font-semibold text-plum">
                Vues de votre fiche
              </p>
            </div>
            <span className="rounded-lg border border-black/10 px-3 py-1 text-xs font-medium text-slate">
              7 derniers jours
            </span>
          </div>
          <p className="mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-3xl font-semibold text-plum">
              {stats.views.toLocaleString("fr-FR")}
            </span>
            <span className="text-xs text-slate">vues au total</span>
          </p>
          <div className="mt-4">
            <LineChart points={viewsSpark} labels={days} />
          </div>
        </div>

        {/* Répartition des devis */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-plum">
            Répartition des devis
          </p>
          {repTotal === 0 ? (
            <p className="mt-6 text-sm text-slate">
              Vos devis apparaîtront ici par statut.
            </p>
          ) : (
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
          )}
        </div>
      </div>

      {/* Demandes récentes + Devis récents + Actions rapides */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Demandes récentes */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-semibold text-plum">
              Demandes récentes
            </p>
            <Link
              href="/pro/messagerie"
              className="text-sm font-semibold text-violet hover:text-violet-dark"
            >
              Tout voir
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                <Inbox size={22} />
              </span>
              <p className="mt-3 text-sm font-semibold text-plum">Aucune demande</p>
              <p className="mt-1 text-xs text-slate">
                Elles apparaîtront dès qu&apos;une famille vous contactera.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/pro/messagerie/${r.id}`}
                    className="flex items-center gap-3"
                  >
                    {r.otherAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.otherAvatar}
                        alt=""
                        className="h-9 w-9 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-soft text-sm font-semibold text-violet">
                        {(r.otherName.trim()[0] || "?").toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-plum">
                        {r.otherName}
                      </p>
                      <p className="truncate text-xs text-slate">
                        {r.subject || "Nouvelle demande"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Devis récents */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-plum">
            Devis récents
          </p>
          {recentQuotes.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-festif-soft text-festif">
                <FileText size={22} />
              </span>
              <p className="mt-3 text-sm font-semibold text-plum">Aucun devis</p>
              <p className="mt-1 text-xs text-slate">
                Envoyez un devis depuis vos demandes.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {recentQuotes.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-plum">
                      {q.client_name || "Client"}
                    </p>
                    <p className="truncate text-xs text-slate">
                      {Number(q.amount).toLocaleString("fr-FR")}€
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      QUOTE_BADGE[q.status] ?? "bg-cream text-slate"
                    }`}
                  >
                    {q.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions rapides */}
        <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-display text-lg font-semibold text-plum">
            Actions rapides
          </p>
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
