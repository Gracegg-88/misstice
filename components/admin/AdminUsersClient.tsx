"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ShieldCheck, Trash2, RotateCcw, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

export type AdminUser = {
  id: string;
  full_name: string | null;
  role: string;
  email: string;
  created_at: string;
  banned: boolean;
};

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-violet-soft text-violet",
  prestataire: "bg-emerald-soft text-emerald",
  particulier: "bg-festif-soft text-festif",
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateurs",
  prestataire: "Prestataires",
  particulier: "Particuliers",
};

// Période d'inscription : nombre de jours (0 = toutes les dates).
const PERIODS = [
  { v: "0", l: "Toutes les dates d'inscription" },
  { v: "7", l: "Inscrits depuis 7 jours" },
  { v: "30", l: "Inscrits depuis 30 jours" },
  { v: "90", l: "Inscrits depuis 3 mois" },
];

const SORTS = [
  { v: "recent", l: "Plus récents d'abord" },
  { v: "ancien", l: "Plus anciens d'abord" },
  { v: "nom", l: "Nom (A → Z)" },
];

// Recherche insensible à la casse et aux accents.
const normalize = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const filterCls =
  "min-w-0 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm text-plum outline-none focus:border-violet";

export default function AdminUsersClient({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState<AdminUser | null>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [state, setState] = useState("all");
  const [period, setPeriod] = useState("0");
  const [sort, setSort] = useState("recent");

  const roles = useMemo(
    () => Array.from(new Set(users.map((u) => u.role))).sort((a, b) => a.localeCompare(b, "fr")),
    [users]
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    const days = Number(period);
    const since = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : 0;
    const list = users.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (state === "actif" && u.banned) return false;
      if (state === "banni" && !u.banned) return false;
      if (since && new Date(u.created_at).getTime() < since) return false;
      if (q && !normalize(`${u.full_name ?? ""} ${u.email}`).includes(q)) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "nom")
        return (a.full_name?.trim() || a.email).localeCompare(b.full_name?.trim() || b.email, "fr");
      const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return sort === "ancien" ? -diff : diff;
    });
  }, [users, query, role, state, period, sort]);

  const hasFilters = query !== "" || role !== "all" || state !== "all" || period !== "0";
  const resetFilters = () => {
    setQuery("");
    setRole("all");
    setState("all");
    setPeriod("0");
  };

  const run = async (
    id: string,
    fn: () => PromiseLike<{ error: unknown }>
  ) => {
    setBusy(id);
    setError("");
    const { error: e } = await fn();
    setBusy(null);
    if (e) {
      setError((e as { message?: string }).message ?? "Action impossible.");
      return false;
    }
    router.refresh();
    return true;
  };

  const toggleBan = (u: AdminUser) => {
    const supabase = createClient();
    void run(u.id, () =>
      supabase.rpc("admin_set_banned", { p_target: u.id, p_banned: !u.banned })
    );
  };

  const doDelete = async () => {
    if (!confirmDel) return;
    const supabase = createClient();
    const ok = await run(confirmDel.id, () =>
      supabase.rpc("admin_delete_user", { p_target: confirmDel.id })
    );
    if (ok) setConfirmDel(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <ConfirmDialog
        open={!!confirmDel}
        title="Supprimer ce compte ?"
        message={`Le compte de « ${confirmDel?.full_name?.trim() || confirmDel?.email} » et toutes ses données seront définitivement supprimés.`}
        loading={busy === confirmDel?.id}
        onConfirm={doDelete}
        onCancel={() => setConfirmDel(null)}
      />

      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Utilisateurs
      </h1>
      <p className="mt-1 text-sm text-slate">
        {hasFilters ? (
          <>
            <span className="font-semibold text-plum">{filtered.length}</span> sur{" "}
          </>
        ) : null}
        {users.length} compte{users.length > 1 ? "s" : ""} sur la plateforme.
      </p>

      {/* Recherche + filtres */}
      <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom ou email…"
            aria-label="Rechercher un utilisateur"
            className={`${filterCls} w-full pl-10`}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex">
          <select
            aria-label="Filtrer par rôle"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={filterCls}
          >
            <option value="all">Tous les rôles</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r] ?? r}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrer par état du compte"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={filterCls}
          >
            <option value="all">Tous les comptes</option>
            <option value="actif">Actifs</option>
            <option value="banni">Bannis</option>
          </select>
          <select
            aria-label="Filtrer par date d'inscription"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className={filterCls}
          >
            {PERIODS.map((p) => (
              <option key={p.v} value={p.v}>
                {p.l}
              </option>
            ))}
          </select>
          <select
            aria-label="Trier les utilisateurs"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className={filterCls}
          >
            {SORTS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-violet transition-colors hover:bg-violet-soft"
          >
            <RotateCcw size={14} aria-hidden="true" />
            Réinitialiser
          </button>
        )}
      </div>
      {error && (
        <p className="mt-3 rounded-xl bg-festif-soft px-4 py-2 text-sm font-medium text-festif">
          {error}
        </p>
      )}

      <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3 font-medium">Nom</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Rôle</th>
                <th className="px-5 py-3 font-medium">Inscription</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate">
                    {users.length === 0
                      ? "Aucun utilisateur."
                      : "Aucun compte ne correspond à ces critères."}
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-3 font-medium text-plum">
                      {u.full_name?.trim() || "—"}
                      {u.banned && (
                        <span className="ml-2 rounded-full bg-black/10 px-2 py-0.5 text-xs font-semibold text-slate">
                          Banni
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate">{u.email}</td>
                    <td className="px-5 py-3">
                      {/* Rôle en lecture seule : la gestion admin ↔ super-admin
                          se fait sur la page « Administrateurs ». */}
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          ROLE_STYLE[u.role] ?? "bg-black/5 text-slate"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate">
                      {new Date(u.created_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      {isSelf ? (
                        <span className="text-xs text-slate">Vous</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busy === u.id}
                            onClick={() => toggleBan(u)}
                            title={u.banned ? "Débannir" : "Bannir"}
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                              u.banned
                                ? "bg-emerald-soft text-emerald hover:opacity-90"
                                : "bg-black/5 text-slate hover:bg-black/10"
                            }`}
                          >
                            {u.banned ? (
                              <>
                                <RotateCcw size={13} /> Débannir
                              </>
                            ) : (
                              <>
                                <Ban size={13} /> Bannir
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={busy === u.id}
                            onClick={() => setConfirmDel(u)}
                            title="Supprimer le compte"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate hover:bg-festif-soft hover:text-festif"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-slate">
        <ShieldCheck size={13} />
        Un compte banni ne peut plus se connecter. Vous ne pouvez pas agir sur
        votre propre compte.
      </p>
    </div>
  );
}
