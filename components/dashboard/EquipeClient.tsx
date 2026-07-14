"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Send, Copy, Check, UserPlus, Users, Trash2, Eye, Lock, MessagesSquare } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import type { TeamMember } from "@/lib/dashboard-types";
import { EVENT_SECTIONS } from "@/lib/permissions";

const SECTION_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_SECTIONS.map((s) => [s.key, s.label])
);

export default function EquipeClient({
  eventId,
  eventName,
  initial,
  isOwner,
  organizer = null,
}: {
  eventId: string;
  eventName: string;
  initial: TeamMember[];
  isOwner: boolean;
  organizer?: { name: string; email: string } | null;
}) {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>(initial);

  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
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
        permissions,
        status: "invited",
      })
      .select("id, event_id, email, role, permissions, user_id, status")
      .single();

    if (insErr) {
      setSending(false);
      setError(insErr.message);
      return;
    }

    if (data) setMembers((prev) => [...prev, data as TeamMember]);

    // Envoi de l'email d'invitation à l'adresse saisie.
    let mailFailed = false;
    if (data) {
      try {
        const res = await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: (data as TeamMember).id }),
        });
        if (!res.ok) mailFailed = true;
      } catch {
        mailFailed = true;
      }
    }

    setSending(false);
    setEmail("");
    setPermissions([]);
    if (mailFailed) {
      setError(
        "Collaborateur ajouté, mais l'email n'a pas pu être envoyé. Copiez son lien pour l'inviter manuellement."
      );
    } else {
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    }
    router.refresh();
  };

  const [confirmId, setConfirmId] = useState<string | null>(null);

  const remove = async (id: string) => {
    const prev = members;
    setMembers((m) => m.filter((x) => x.id !== id));
    const supabase = createClient();
    const { data, error: delErr } = await supabase
      .from("event_members")
      .delete()
      .eq("id", id)
      .select("id");
    if (delErr || !data || data.length === 0) {
      setMembers(prev);
      setError(delErr?.message ?? "Suppression impossible (droits insuffisants ?).");
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Équipe
          </h1>
          <p className="mt-1 text-sm text-slate">
            {members.length} collaborateur{members.length > 1 ? "s" : ""} · {eventName}
          </p>
        </div>
        <Link
          href={`/dashboard/messages/equipe/${eventId}`}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
        >
          <MessagesSquare size={17} />
          Discussion d&apos;équipe
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Membres */}
        <div className="space-y-3 lg:col-span-2">
          {/* Organisateur de l'événement (fait partie de l'équipe). */}
          {organizer && (
            <div className="flex items-center justify-between gap-3 rounded-3xl border border-violet/20 bg-violet-soft/40 p-4 sm:p-5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet text-sm font-semibold text-white">
                  {(organizer.name.trim()[0] || "?").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-base font-semibold text-plum">
                    {organizer.email}
                  </p>
                  <p className="truncate text-xs text-slate">{organizer.name}</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-violet px-2.5 py-1 text-xs font-semibold text-white">
                Organisateur
              </span>
            </div>
          )}
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
                className="flex flex-col gap-3 rounded-3xl border border-black/5 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet text-sm font-semibold text-white">
                    {initialOf(m)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-plum">
                      {m.email}
                    </p>
                    {m.permissions && m.permissions.length > 0 ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {m.permissions.map((p) => (
                          <span
                            key={p}
                            className="rounded-md bg-violet-soft px-1.5 py-0.5 text-[11px] font-medium text-violet"
                          >
                            {SECTION_LABEL[p] ?? p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate">
                        <Eye size={12} />
                        Lecture seule
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                  {m.status === "accepted" ? (
                    <span className="rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-medium text-emerald">
                      Membre
                    </span>
                  ) : (
                    <>
                      <span className="rounded-full bg-festif-soft px-2.5 py-1 text-xs font-medium text-festif">
                        Invité
                      </span>
                      {isOwner && (
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
                      )}
                    </>
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setConfirmId(m.id)}
                      aria-label="Retirer ce membre"
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-slate hover:bg-cream hover:text-festif"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
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

      {/* Inviter quelqu'un — réservé à l'organisateur de l'événement */}
      {!isOwner ? (
        <div className="mt-6 flex items-center gap-3 rounded-3xl border border-black/5 bg-white p-5 text-sm text-slate">
          <Lock size={18} className="shrink-0 text-violet" />
          Seul l&apos;organisateur de l&apos;événement peut inviter et gérer
          l&apos;équipe.
        </div>
      ) : (
      <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6">
        <div className="flex items-center gap-2">
          <UserPlus size={18} className="text-violet" />
          <h2 className="font-display text-lg font-semibold text-plum">
            Inviter quelqu&apos;un dans l&apos;équipe
          </h2>
        </div>
        <p className="mt-1 text-sm text-slate">
          Choisissez les sections que ce collaborateur pourra <strong>modifier</strong>.
          Il pourra voir tout l&apos;événement, mais ne modifiera que ce que vous
          cochez (le reste reste en lecture seule).
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
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
              Peut modifier
            </p>
            <div className="flex flex-wrap gap-2">
              {EVENT_SECTIONS.map((s) => {
                const on = permissions.includes(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() =>
                      setPermissions((p) =>
                        on ? p.filter((x) => x !== s.key) : [...p, s.key]
                      )
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      on
                        ? "bg-violet text-white"
                        : "border border-black/10 bg-cream text-slate hover:text-plum"
                    }`}
                  >
                    {on && <Check size={13} />}
                    {s.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate">
              Aucune section cochée = accès en <strong>lecture seule</strong>.
            </p>
          </div>
          {error && <p className="text-sm text-festif">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet py-3.5 text-base font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
          >
            {sent ? (
              <>
                <Check size={18} /> Invitation envoyée
              </>
            ) : (
              <>
                <Send size={17} />{" "}
                {sending ? "Envoi…" : "Inviter le collaborateur"}
              </>
            )}
          </button>
        </form>

        {/* Aide sur le lien d'invitation */}
        <p className="mt-4 border-t border-black/5 pt-4 text-center text-xs text-slate">
          Un email d&apos;invitation est envoyé automatiquement à l&apos;adresse
          saisie. Vous pouvez aussi cliquer sur « Lien » à côté du membre pour
          copier son lien personnel. En l&apos;ouvrant (et en se connectant), il
          rejoindra automatiquement l&apos;événement.
        </p>
      </div>
      )}
    </div>
  );
}
