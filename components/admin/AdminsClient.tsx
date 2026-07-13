"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Send,
  ShieldCheck,
  Shield,
  Check,
  Ban,
  UserMinus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ConfirmDialog from "@/components/ConfirmDialog";

export type AdminRow = {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  banned: boolean;
  can_manage_admins: boolean;
};

const fdate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function AdminsClient({
  initial,
  currentUserId,
}: {
  initial: AdminRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminRow[]>(initial);
  // Resynchronise avec les données serveur après router.refresh()
  // (sinon un admin fraîchement invité n'apparaît pas sans rechargement).
  useEffect(() => {
    setAdmins(initial);
  }, [initial]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [canManage, setCanManage] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: "revoke" | "ban" | "unban"; row: AdminRow }
    | null
  >(null);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!email.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/invite-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, canManage }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Envoi impossible.");
      } else if (json.mailFailed) {
        setNotice(
          `Compte créé, mais l'email n'a pas pu être envoyé. Mot de passe temporaire : ${json.password}`
        );
        setFirstName("");
        setLastName("");
        setEmail("");
        setCanManage(false);
        router.refresh();
      } else {
        setNotice(`Invitation envoyée à ${email}.`);
        setFirstName("");
        setLastName("");
        setEmail("");
        setCanManage(false);
        router.refresh();
      }
    } catch {
      setError("Une erreur réseau est survenue.");
    }
    setSending(false);
  };

  const call = async (
    fn: string,
    args: Record<string, unknown>,
    id: string,
    apply: (a: AdminRow[]) => AdminRow[]
  ) => {
    setBusy(id);
    setError("");
    const supabase = createClient();
    const { error: rpcErr } = await supabase.rpc(fn, args);
    setBusy(null);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }
    setAdmins(apply);
    router.refresh();
  };

  const toggleManage = (r: AdminRow) =>
    call(
      "sadmin_set_manage",
      { p_target: r.id, p_can_manage: !r.can_manage_admins },
      r.id,
      (a) =>
        a.map((x) =>
          x.id === r.id ? { ...x, can_manage_admins: !r.can_manage_admins } : x
        )
    );

  const doConfirm = () => {
    if (!confirm) return;
    const { kind, row } = confirm;
    setConfirm(null);
    if (kind === "revoke")
      call("sadmin_revoke_admin", { p_target: row.id }, row.id, (a) =>
        a.filter((x) => x.id !== row.id)
      );
    else
      call(
        "sadmin_set_banned",
        { p_target: row.id, p_banned: kind === "ban" },
        row.id,
        (a) =>
          a.map((x) =>
            x.id === row.id ? { ...x, banned: kind === "ban" } : x
          )
      );
  };

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Administrateurs
      </h1>
      <p className="mt-1 text-sm text-slate">
        Gérez les comptes d&apos;administration de Misstice.
      </p>

      {/* Inviter */}
      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-soft text-violet">
            <Mail size={17} />
          </span>
          <h2 className="font-display text-lg font-semibold text-plum">
            Inviter un nouvel administrateur
          </h2>
        </div>
        <form onSubmit={invite} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate">
                Prénom
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex : Jean"
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate">
                Nom
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex : Dupont"
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate">
              Adresse email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemple.com"
              className={`mt-1.5 ${inputCls}`}
            />
          </div>
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-black/5 bg-cream/50 p-4">
            <span>
              <span className="block text-sm font-semibold text-plum">
                Accès à la page Administrateurs
              </span>
              <span className="block text-xs text-slate">
                Ce compte pourra inviter et gérer d&apos;autres administrateurs.
              </span>
            </span>
            <input
              type="checkbox"
              checked={canManage}
              onChange={(e) => setCanManage(e.target.checked)}
              className="h-5 w-5 shrink-0 accent-violet"
            />
          </label>
          {error && <p className="text-sm text-festif">{error}</p>}
          {notice && (
            <p className="rounded-xl bg-emerald-soft px-4 py-2.5 text-sm text-emerald">
              {notice}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet px-6 py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
            >
              <Send size={16} />
              {sending ? "Envoi…" : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>

      {/* Liste */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
                <th className="px-5 py-3 font-medium">Administrateur</th>
                <th className="px-5 py-3 font-medium">Statut</th>
                <th className="px-5 py-3 font-medium">Permissions</th>
                <th className="px-5 py-3 font-medium">Depuis</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const isSelf = a.id === currentUserId;
                return (
                  <tr key={a.id} className="border-b border-black/5 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet text-xs font-semibold text-white">
                          {(a.full_name?.trim()[0] || a.email[0]).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-medium text-plum">
                            <span className="truncate">
                              {a.full_name?.trim() || "Administrateur"}
                            </span>
                            {isSelf && (
                              <span className="rounded-full bg-festif-soft px-2 py-0.5 text-[11px] font-semibold text-festif">
                                Vous
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-slate">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {a.banned ? (
                        <span className="rounded-full bg-festif-soft px-2.5 py-0.5 text-xs font-semibold text-festif">
                          Suspendu
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-soft px-2.5 py-0.5 text-xs font-semibold text-emerald">
                          <Check size={12} />
                          Actif
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {a.can_manage_admins ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-soft px-2.5 py-0.5 text-xs font-semibold text-violet">
                          <ShieldCheck size={12} />
                          Peut gérer les admins
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate">
                          <Shield size={12} />
                          Admin standard
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate">{fdate(a.created_at)}</td>
                    <td className="px-5 py-3">
                      {isSelf ? (
                        <p className="text-right text-slate">—</p>
                      ) : (
                        <div className="flex flex-wrap items-center justify-end gap-3 text-xs font-semibold">
                          <button
                            type="button"
                            disabled={busy === a.id}
                            onClick={() => toggleManage(a)}
                            className="text-violet hover:underline disabled:opacity-50"
                          >
                            {a.can_manage_admins
                              ? "Retirer accès admins"
                              : "Donner accès admins"}
                          </button>
                          <button
                            type="button"
                            disabled={busy === a.id}
                            onClick={() =>
                              setConfirm({
                                kind: a.banned ? "unban" : "ban",
                                row: a,
                              })
                            }
                            className="inline-flex items-center gap-1 text-festif hover:underline disabled:opacity-50"
                          >
                            <Ban size={13} />
                            {a.banned ? "Réactiver" : "Suspendre"}
                          </button>
                          <button
                            type="button"
                            disabled={busy === a.id}
                            onClick={() => setConfirm({ kind: "revoke", row: a })}
                            className="inline-flex items-center gap-1 text-slate hover:text-plum hover:underline disabled:opacity-50"
                          >
                            <UserMinus size={13} />
                            Retirer admin
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

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "revoke"
            ? "Retirer les droits d'administrateur ?"
            : confirm?.kind === "ban"
              ? "Suspendre cet administrateur ?"
              : "Réactiver cet administrateur ?"
        }
        message={
          confirm?.kind === "revoke"
            ? `« ${confirm?.row.email} » redeviendra un compte particulier.`
            : confirm?.kind === "ban"
              ? `« ${confirm?.row.email} » ne pourra plus se connecter.`
              : `« ${confirm?.row.email} » pourra de nouveau se connecter.`
        }
        confirmLabel={
          confirm?.kind === "revoke"
            ? "Retirer"
            : confirm?.kind === "ban"
              ? "Suspendre"
              : "Réactiver"
        }
        onConfirm={doConfirm}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
