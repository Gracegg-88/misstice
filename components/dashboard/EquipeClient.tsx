"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Send, Copy, Check, UserPlus, Users, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/dashboard-types";

export default function EquipeClient({
  eventId,
  eventName,
  initial,
}: {
  eventId: string;
  eventName: string;
  initial: TeamMember[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>(initial);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const accepted = members.filter((m) => m.status === "accepted").length;
  const pending = members.filter((m) => m.status === "invited").length;

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) return;
    setSending(true);
    setError("");

    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("event_members")
      .insert({
        event_id: eventId,
        email: cleanEmail,
        role: role.trim() || null,
        status: "invited",
      })
      .select("id, event_id, email, role, user_id, status")
      .single();

    setSending(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }

    if (data) setMembers((prev) => [...prev, data as TeamMember]);
    setEmail("");
    setRole("");
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    router.refresh();
  };

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const remove = async (id: string) => {
    const prev = members;
    setMembers((m) => m.filter((x) => x.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("event_members")
      .delete()
      .eq("id", id);
    if (delErr) {
      setMembers(prev);
      setError(delErr.message);
      return;
    }
    router.refresh();
  };

  const copyInvite = (id: string) => {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}/invitation/${id}`
        : `/invitation/${id}`;
    navigator.clipboard?.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  };

  const initialOf = (m: TeamMember) =>
    (m.role?.trim()?.[0] || m.email.trim()[0] || "?").toUpperCase();

  return (
    <div className="mx-auto max-w-6xl">
      <ConfirmDialog
        open={!!confirmId}
        title="Retirer ce collaborateur ?"
        message="Il n'aura plus accès à cet événement."
        confirmLabel="Retirer"
        onConfirm={() => {
          if (confirmId) void remove(confirmId);
          setConfirmId(null);
        }}
        onCancel={() => setConfirmId(null)}
      />
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Équipe
      </h1>
      <p className="mt-1 text-sm text-slate">
        {members.length} collaborateur{members.length > 1 ? "s" : ""} · {eventName}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Membres */}
        <div className="space-y-3 lg:col-span-2">
          {members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                <Users size={22} />
              </div>
              <p className="mt-3 font-display text-base font-semibold text-plum">
                Aucun membre pour l&apos;instant
              </p>
              <p className="mt-1 text-sm text-slate">
                Invitez un proche ci-dessous pour organiser à plusieurs.
              </p>
            </div>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 rounded-3xl border border-black/5 bg-white p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet text-sm font-semibold text-white">
                    {initialOf(m)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-plum">
                      {m.email}
                    </p>
                    <p className="truncate text-sm text-slate">
                      {m.role?.trim() || "Rôle non précisé"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.status === "accepted" ? (
                    <span className="rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-medium text-emerald">
                      Membre
                    </span>
                  ) : (
                    <>
                      <span className="rounded-full bg-festif-soft px-2.5 py-1 text-xs font-medium text-festif">
                        Invité
                      </span>
                      <button
                        type="button"
                        onClick={() => copyInvite(m.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-semibold text-plum hover:bg-cream"
                      >
                        {copiedId === m.id ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                        {copiedId === m.id ? "Copié" : "Lien"}
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmId(m.id)}
                    aria-label="Retirer ce membre"
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate hover:bg-cream hover:text-festif"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Résumé de l'équipe */}
        <div className="rounded-3xl border border-black/5 bg-white p-6">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-violet" />
            <h2 className="font-display text-lg font-semibold text-plum">
              Résumé de l&apos;équipe
            </h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
              <span className="text-sm text-slate">Membres actifs</span>
              <span className="font-display text-xl font-semibold text-emerald">
                {accepted}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
              <span className="text-sm text-slate">Invitations en attente</span>
              <span className="font-display text-xl font-semibold text-festif">
                {pending}
              </span>
            </div>
          </div>
          <p className="mt-4 text-sm text-slate">
            {members.length === 0
              ? "Personne n'a encore rejoint l'organisation."
              : `${accepted} membre${accepted > 1 ? "s" : ""} · ${pending} invitation${pending > 1 ? "s" : ""} en attente.`}
          </p>
        </div>
      </div>

      {/* Inviter quelqu'un */}
      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-violet" />
          <h2 className="font-display text-lg font-semibold text-plum">
            Inviter quelqu&apos;un dans l&apos;équipe
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate">
          Ajoutez un proche pour qu&apos;il participe à l&apos;organisation
          (tâches, budget, invités…).
        </p>

        <form onSubmit={invite} className="mt-4 space-y-3">
          <div className="relative">
            <Mail
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="w-full rounded-xl border border-black/10 bg-cream py-3 pl-11 pr-4 text-sm outline-none focus:border-violet"
            />
          </div>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Rôle (ex : Gère le traiteur)"
            className="w-full rounded-xl border border-black/10 bg-cream px-4 py-3 text-sm outline-none focus:border-violet"
          />
          {error && <p className="text-sm text-festif">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet py-3.5 text-base font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
          >
            {sent ? (
              <>
                <Check size={18} /> Ajouté — copiez son lien
              </>
            ) : (
              <>
                <Send size={17} /> {sending ? "Ajout…" : "Ajouter le collaborateur"}
              </>
            )}
          </button>
        </form>

        {/* Aide sur le lien d'invitation */}
        <p className="mt-4 border-t border-black/5 pt-4 text-center text-xs text-slate">
          Après l&apos;invitation, cliquez sur « Lien » à côté du membre pour
          copier son lien personnel et le lui envoyer. En l&apos;ouvrant (et en
          se connectant), il rejoindra automatiquement l&apos;événement.
        </p>
      </div>
    </div>
  );
}
