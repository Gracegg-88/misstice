"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Mail, Phone, Check, Trash2, Copy, Image as ImageIcon } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { createClient } from "@/lib/supabase/client";
import { cloudinaryConfigured, uploadToCloudinary } from "@/lib/cloudinary";
import type { Guest } from "@/lib/dashboard-types";
import ReadOnlyBanner from "@/components/dashboard/ReadOnlyBanner";

type Status = Guest["status"];

// Ordre + libellés d'affichage pour les statuts (les valeurs correspondent
// exactement à la contrainte de la table `guests`).
const STATUSES: { value: Status; label: string; style: string }[] = [
  { value: "confirmé", label: "Confirmé", style: "bg-emerald-soft text-emerald" },
  { value: "en attente", label: "En attente", style: "bg-festif-soft text-festif" },
  { value: "invité", label: "Invité", style: "bg-violet-soft text-violet" },
  { value: "décliné", label: "Décliné", style: "bg-black/5 text-slate" },
];

const STATUS_META: Record<Status, { label: string; style: string }> =
  Object.fromEntries(
    STATUSES.map((s) => [s.value, { label: s.label, style: s.style }])
  ) as Record<Status, { label: string; style: string }>;

export default function InvitesClient({
  eventId,
  eventName,
  initial,
  cardUrl = null,
  canEdit = true,
}: {
  eventId: string;
  eventName: string;
  initial: Guest[];
  cardUrl?: string | null;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>(initial);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Carte d'invitation (image) envoyée dans l'email RSVP.
  const [card, setCard] = useState<string | null>(cardUrl);
  const [cardBusy, setCardBusy] = useState(false);
  const cardRef = useRef<HTMLInputElement>(null);

  const onCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (cardRef.current) cardRef.current.value = "";
    if (!file || !canEdit) return;
    if (file.size > 8 * 1024 * 1024) {
      setError("Carte trop lourde (max 8 Mo).");
      return;
    }
    setCardBusy(true);
    setError("");
    try {
      const up = await uploadToCloudinary(file);
      const supabase = createClient();
      const { error: upErr } = await supabase
        .from("events")
        .update({ invitation_card_url: up.url })
        .eq("id", eventId);
      if (upErr) {
        setError(upErr.message);
      } else {
        setCard(up.url);
        router.refresh();
      }
    } catch {
      setError("Téléversement de la carte échoué.");
    }
    setCardBusy(false);
  };

  const copyRsvp = (id: string) => {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}/rsvp/${id}`
        : `/rsvp/${id}`;
    navigator.clipboard?.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 2000);
  };

  // Envoie le lien RSVP par email à l'invité.
  const [mailStatus, setMailStatus] = useState<
    Record<string, "sending" | "sent" | "error">
  >({});
  const inFlight = useRef<Set<string>>(new Set());

  const sendRsvp = async (g: Guest) => {
    // Garde anti-doublon : on n'envoie pas si un envoi est déjà en cours.
    if (!g.email || inFlight.current.has(g.id)) return;
    inFlight.current.add(g.id);
    setMailStatus((m) => ({ ...m, [g.id]: "sending" }));
    try {
      const rsvpUrl = `${window.location.origin}/rsvp/${g.id}`;
      const res = await fetch("/api/send-rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: g.name,
          email: g.email,
          eventName,
          rsvpUrl,
        }),
      });
      if (!res.ok) throw new Error();
      setMailStatus((m) => ({ ...m, [g.id]: "sent" }));
    } catch {
      setMailStatus((m) => ({ ...m, [g.id]: "error" }));
    } finally {
      inFlight.current.delete(g.id);
    }
  };

  // Groupes dérivés des données réelles (fallback sur une liste par défaut).
  const groups = useMemo(() => {
    const found = Array.from(
      new Set(
        guests
          .map((g) => g.group_label)
          .filter((g): g is string => !!g && g.trim().length > 0)
      )
    );
    return found;
  }, [guests]);

  const [form, setForm] = useState<{
    name: string;
    email: string;
    phone: string;
    diet: string;
    group_label: string;
    status: Status;
    plus_one: boolean;
  }>({
    name: "",
    email: "",
    phone: "",
    diet: "",
    group_label: "",
    status: "invité",
    plus_one: false,
  });

  const counts = useMemo(() => {
    const c: Record<Status, number> = {
      confirmé: 0,
      "en attente": 0,
      invité: 0,
      décliné: 0,
    };
    guests.forEach((g) => (c[g.status] += 1));
    return c;
  }, [guests]);

  const totalPeople = guests.reduce((s, g) => s + 1 + (g.plus_one ? 1 : 0), 0);

  const statusLabels = STATUSES.map((s) => s.label);

  const shown = guests.filter((g) => {
    if (statusLabels.includes(filter) && STATUS_META[g.status].label !== filter)
      return false;
    if (groups.includes(filter) && g.group_label !== filter) return false;
    const q = query.trim().toLowerCase();
    if (
      q &&
      !`${g.name} ${g.email ?? ""} ${g.group_label ?? ""}`
        .toLowerCase()
        .includes(q)
    )
      return false;
    return true;
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!form.name.trim()) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: insErr } = await supabase
      .from("guests")
      .insert({
        event_id: eventId,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        diet: form.diet.trim() || null,
        group_label: form.group_label || null,
        status: form.status,
        plus_one: form.plus_one,
      })
      .select("id, event_id, name, email, phone, diet, group_label, status, plus_one")
      .single();
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    if (data) {
      setGuests((p) => [...p, data as Guest]);
      // Envoi automatique du lien RSVP si un email a été renseigné.
      if ((data as Guest).email) void sendRsvp(data as Guest);
    }
    setForm({
      name: "",
      email: "",
      phone: "",
      diet: "",
      group_label: "",
      status: "invité",
      plus_one: false,
    });
    setOpen(false);
    router.refresh();
  };

  // Fait passer un invité au statut suivant (cycle) et persiste.
  const cycleStatus = async (g: Guest) => {
    if (!canEdit) return;
    const order = STATUSES.map((s) => s.value);
    const next = order[(order.indexOf(g.status) + 1) % order.length];
    setGuests((p) => p.map((x) => (x.id === g.id ? { ...x, status: next } : x)));
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("guests")
      .update({ status: next })
      .eq("id", g.id);
    if (upErr) {
      // Revert en cas d'échec.
      setGuests((p) =>
        p.map((x) => (x.id === g.id ? { ...x, status: g.status } : x))
      );
      return;
    }
    router.refresh();
  };

  const [confirmGuest, setConfirmGuest] = useState<{ id: string; name: string } | null>(
    null
  );

  const remove = async (id: string) => {
    if (!canEdit) return;
    const prev = guests;
    setGuests((p) => p.filter((x) => x.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("guests")
      .delete()
      .eq("id", id);
    if (delErr) {
      setGuests(prev);
      return;
    }
    router.refresh();
  };

  const chips = ["Tous", ...statusLabels, ...groups];

  return (
    <>
      <ConfirmDialog
        open={!!confirmGuest}
        title="Supprimer cet invité ?"
        message={`« ${confirmGuest?.name ?? ""} » sera retiré de la liste.`}
        onConfirm={() => {
          if (confirmGuest) void remove(confirmGuest.id);
          setConfirmGuest(null);
        }}
        onCancel={() => setConfirmGuest(null)}
      />
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Invités
          </h1>
          <p className="mt-1 text-sm text-slate">
            {guests.length} invités · {totalPeople} personnes au total (avec +1)
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            <Plus size={16} />
            Ajouter un invité
          </button>
        )}
      </div>
      {!canEdit && <div className="mt-6"><ReadOnlyBanner section="les invités" /></div>}

      {/* Carte d'invitation (envoyée dans l'email RSVP) */}
      {canEdit && cloudinaryConfigured() && (
        <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-black/5 bg-white p-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {card ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card}
                alt="Carte d'invitation"
                className="h-20 w-28 shrink-0 rounded-xl border border-black/5 object-cover"
              />
            ) : (
              <span className="flex h-20 w-28 shrink-0 items-center justify-center rounded-xl bg-cream text-slate">
                <ImageIcon size={26} />
              </span>
            )}
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-plum">
                Carte d&apos;invitation
              </p>
              <p className="mt-0.5 text-sm text-slate">
                Elle s&apos;affiche directement dans l&apos;email RSVP, avec les
                boutons Accepter / Décliner.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => cardRef.current?.click()}
            disabled={cardBusy}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
          >
            <ImageIcon size={16} />
            {cardBusy ? "Envoi…" : card ? "Changer la carte" : "Ajouter une carte"}
          </button>
          <input
            ref={cardRef}
            type="file"
            accept="image/*"
            onChange={onCardUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Stat cards (flip au survol : recto = nombre, verso = part du total) */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[
          { l: "Confirmés", v: counts["confirmé"], c: "bg-emerald", back: "bg-emerald/90" },
          { l: "En attente", v: counts["en attente"], c: "bg-festif", back: "bg-festif/90" },
          { l: "Invités", v: counts["invité"], c: "bg-violet", back: "bg-violet/90" },
          { l: "Déclinés", v: counts["décliné"], c: "bg-black/30", back: "bg-black/40" },
        ].map((s) => {
          const share = guests.length
            ? Math.round((s.v / guests.length) * 100)
            : 0;
          return (
            <div key={s.l} className="ev-flip h-28">
              <div className="ev-flip-inner">
                <div className={`ev-flip-face p-5 text-white ${s.c}`}>
                  <p className="font-display text-3xl font-semibold">{s.v}</p>
                  <p className="mt-1 text-sm opacity-90">{s.l}</p>
                </div>
                <div className={`ev-flip-face ev-flip-back p-5 text-white ${s.back}`}>
                  <p className="font-display text-3xl font-semibold">{share}%</p>
                  <p className="mt-1 text-sm opacity-90">de vos invités</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mt-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un invité…"
          className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet"
        />
      </div>

      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {chips.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === f ? "bg-violet text-white" : "bg-white text-slate hover:text-plum"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-3xl border border-black/5 bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
              <th className="px-5 py-3 font-medium">Invité</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Contact</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Groupe</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 text-center font-medium">+1</th>
              <th className="px-5 py-3 text-center font-medium sr-only">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {shown.map((g) => (
              <tr key={g.id} className="group hover:bg-cream/60">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-soft text-xs font-semibold text-violet">
                      {g.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <div>
                      <p className="font-medium text-plum">{g.name}</p>
                      {g.diet && <p className="text-xs text-festif">{g.diet}</p>}
                    </div>
                  </div>
                </td>
                <td className="hidden px-5 py-3 text-slate sm:table-cell">
                  {g.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail size={13} />
                      {g.email}
                    </span>
                  )}
                  {g.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone size={13} />
                      {g.phone}
                    </span>
                  )}
                </td>
                <td className="hidden px-5 py-3 text-slate md:table-cell">
                  {g.group_label ?? "—"}
                </td>
                <td className="px-5 py-3">
                  {canEdit ? (
                    <button
                      type="button"
                      onClick={() => cycleStatus(g)}
                      title="Changer le statut"
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80 ${STATUS_META[g.status].style}`}
                    >
                      {STATUS_META[g.status].label}
                    </button>
                  ) : (
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_META[g.status].style}`}
                    >
                      {STATUS_META[g.status].label}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-center text-slate">
                  {g.plus_one ? <Check size={16} className="mx-auto text-emerald" /> : "—"}
                </td>
                <td className="px-5 py-3">
                  {!canEdit ? (
                    <p className="text-center text-slate">—</p>
                  ) : (
                  <div className="flex items-center justify-center gap-1">
                    {g.email && (
                      <button
                        type="button"
                        onClick={() => sendRsvp(g)}
                        title="Envoyer l'invitation RSVP par email"
                        disabled={mailStatus[g.id] === "sending"}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate transition-colors hover:bg-black/5 hover:text-violet disabled:opacity-60"
                      >
                        {mailStatus[g.id] === "sent" ? (
                          <Check size={14} className="text-emerald" />
                        ) : (
                          <Mail size={14} />
                        )}
                        <span className="hidden lg:inline">
                          {mailStatus[g.id] === "sending"
                            ? "Envoi…"
                            : mailStatus[g.id] === "sent"
                              ? "Envoyé"
                              : mailStatus[g.id] === "error"
                                ? "Erreur"
                                : "Email"}
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => copyRsvp(g.id)}
                      title="Copier le lien RSVP"
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate transition-colors hover:bg-black/5 hover:text-violet"
                    >
                      {copiedId === g.id ? (
                        <Check size={14} className="text-emerald" />
                      ) : (
                        <Copy size={14} />
                      )}
                      <span className="hidden lg:inline">
                        {copiedId === g.id ? "Copié" : "RSVP"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmGuest({ id: g.id, name: g.name })}
                      title="Supprimer l'invité"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate opacity-0 transition-colors hover:bg-black/5 hover:text-festif group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {shown.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-slate">Aucun invité ne correspond.</p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">Ajouter un invité</h3>
              <button onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={add} className="space-y-4">
              <input
                autoFocus
                placeholder="Nom complet"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Téléphone (facultatif)"
                  className="rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm outline-none focus:border-violet"
                />
                <input
                  value={form.diet}
                  onChange={(e) => setForm({ ...form, diet: e.target.value })}
                  placeholder="Régime / allergies"
                  className="rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm outline-none focus:border-violet"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={form.group_label}
                  onChange={(e) => setForm({ ...form, group_label: e.target.value })}
                  placeholder="Groupe (ex. Famille, Amis…)"
                  className="rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm outline-none focus:border-violet"
                />
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  aria-label="Statut de l'invité"
                  className="rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm outline-none focus:border-violet"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-plum">
                <input
                  type="checkbox"
                  checked={form.plus_one}
                  onChange={(e) => setForm({ ...form, plus_one: e.target.checked })}
                  className="h-4 w-4 rounded border-black/20 text-violet focus:ring-violet"
                />
                Autorise un accompagnant (+1)
              </label>
              {error && <p className="text-sm text-festif">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {saving ? "Enregistrement…" : "Ajouter"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
