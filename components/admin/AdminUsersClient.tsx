"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, ShieldCheck, Trash2, RotateCcw } from "lucide-react";
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
        {users.length} compte{users.length > 1 ? "s" : ""} sur la plateforme.
      </p>
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
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-slate">
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
              {users.map((u) => {
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
