"use client";

import { useMemo, useState } from "react";
import { Search, Plus, X, Mail, Phone, Check } from "lucide-react";

type Status = "Confirmé" | "En attente" | "Invité" | "Décliné";
type Guest = {
  id: number;
  name: string;
  diet?: string;
  email?: string;
  phone?: string;
  group: string;
  status: Status;
  plusOne: boolean;
};

const GROUPS = ["Famille Marié", "Famille Mariée", "Amis Communs", "Collègues"];

const INITIAL: Guest[] = [
  { id: 1, name: "Jean-Pierre Dubois", email: "jp.dubois@gmail.com", phone: "06 12 34 56 78", group: "Famille Marié", status: "Confirmé", plusOne: true },
  { id: 2, name: "Marie-Thérèse Koné", diet: "Végétarien", email: "mt.kone@yahoo.fr", group: "Famille Mariée", status: "Confirmé", plusOne: false },
  { id: 3, name: "Alain Traoré", phone: "07 89 01 23 45", group: "Amis Communs", status: "Confirmé", plusOne: true },
  { id: 4, name: "Fatou Diallo", email: "fatou.diallo@gmail.com", group: "Famille Mariée", status: "En attente", plusOne: false },
  { id: 5, name: "Thomas Lefèvre", email: "thomas.lefevre@pro.fr", group: "Collègues", status: "En attente", plusOne: true },
  { id: 6, name: "Aminata Bah", email: "a.bah@gmail.com", group: "Amis Communs", status: "Décliné", plusOne: false },
  { id: 7, name: "Christophe Martin", email: "c.martin@hotmail.com", group: "Collègues", status: "Invité", plusOne: false },
  { id: 8, name: "Nadia Coulibaly", diet: "Sans gluten", phone: "06 55 44 33 22", group: "Famille Marié", status: "Invité", plusOne: true },
  { id: 9, name: "Robert Nguyen", email: "r.nguyen@gmail.com", group: "Amis Communs", status: "Confirmé", plusOne: false },
  { id: 10, name: "Isabelle Sanchez", email: "i.sanchez@gmail.com", group: "Famille Mariée", status: "Confirmé", plusOne: true },
  { id: 11, name: "Moussa Diakité", email: "moussa.d@gmail.com", group: "Famille Marié", status: "En attente", plusOne: false },
  { id: 12, name: "Sophie Bernard", email: "sophie.b@gmail.com", group: "Amis Communs", status: "Confirmé", plusOne: true },
];

const STATUS_STYLE: Record<Status, string> = {
  Confirmé: "bg-emerald-soft text-emerald",
  "En attente": "bg-festif-soft text-festif",
  Invité: "bg-violet-soft text-violet",
  Décliné: "bg-black/5 text-slate",
};

export default function InvitesPage() {
  const [guests, setGuests] = useState<Guest[]>(INITIAL);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tous");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", group: GROUPS[0], status: "Invité" as Status });

  const counts = useMemo(() => {
    const c: Record<string, number> = { Confirmé: 0, "En attente": 0, Invité: 0, Décliné: 0 };
    guests.forEach((g) => (c[g.status] += 1));
    return c;
  }, [guests]);

  const totalPeople = guests.reduce((s, g) => s + 1 + (g.plusOne ? 1 : 0), 0);

  const shown = guests.filter((g) => {
    if (["Confirmé", "En attente", "Invité", "Décliné"].includes(filter) && g.status !== filter) return false;
    if (GROUPS.includes(filter) && g.group !== filter) return false;
    const q = query.trim().toLowerCase();
    if (q && !`${g.name} ${g.email ?? ""} ${g.group}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setGuests((p) => [
      ...p,
      { id: Date.now(), name: form.name, email: form.email, group: form.group, status: form.status, plusOne: false },
    ]);
    setForm({ name: "", email: "", group: GROUPS[0], status: "Invité" });
    setOpen(false);
  };

  const chips = ["Tous", "Confirmé", "En attente", "Invité", "Décliné", ...GROUPS];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Invités
          </h1>
          <p className="mt-1 text-sm text-slate">
            {guests.length} invités · {totalPeople} personnes au total (avec +1)
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          <Plus size={16} />
          Ajouter un invité
        </button>
      </div>

      {/* Stat cards (flip au survol : recto = nombre, verso = part du total) */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { l: "Confirmés", v: counts["Confirmé"], c: "bg-emerald", back: "bg-emerald/90" },
          { l: "En attente", v: counts["En attente"], c: "bg-festif", back: "bg-festif/90" },
          { l: "Invités", v: counts["Invité"], c: "bg-violet", back: "bg-violet/90" },
          { l: "Déclinés", v: counts["Décliné"], c: "bg-black/30", back: "bg-black/40" },
        ].map((s) => {
          const share = Math.round((s.v / guests.length) * 100);
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wide text-slate">
              <th className="px-5 py-3 font-medium">Invité</th>
              <th className="hidden px-5 py-3 font-medium sm:table-cell">Contact</th>
              <th className="hidden px-5 py-3 font-medium md:table-cell">Groupe</th>
              <th className="px-5 py-3 font-medium">Statut</th>
              <th className="px-5 py-3 text-center font-medium">+1</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {shown.map((g) => (
              <tr key={g.id} className="hover:bg-cream/60">
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
                <td className="hidden px-5 py-3 text-slate md:table-cell">{g.group}</td>
                <td className="px-5 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[g.status]}`}>
                    {g.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-center text-slate">
                  {g.plusOne ? <Check size={16} className="mx-auto text-emerald" /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={form.group}
                  onChange={(e) => setForm({ ...form, group: e.target.value })}
                  className="rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm outline-none focus:border-violet"
                >
                  {GROUPS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                  className="rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-sm outline-none focus:border-violet"
                >
                  <option>Invité</option>
                  <option>En attente</option>
                  <option>Confirmé</option>
                  <option>Décliné</option>
                </select>
              </div>
              <button className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark">
                Ajouter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
