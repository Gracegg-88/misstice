"use client";

import { useState } from "react";
import { Mail, Send, Copy, Check, UserPlus, Activity } from "lucide-react";

type Member = {
  name: string;
  role: string;
  emoji: string;
  done: number;
  total: number;
  color: string;
  pending?: boolean;
};

const MEMBERS: Member[] = [
  { name: "Sophie Dubois", role: "Organisatrice principale", emoji: "👑", done: 5, total: 8, color: "#6C3CE1" },
  { name: "Marc Koné", role: "Co-organisateur", emoji: "🤝", done: 4, total: 6, color: "#FF8C42" },
  { name: "Mme Dubois (Maman)", role: "Gère les invitations & faire-part", emoji: "✉️", done: 2, total: 4, color: "#10B981" },
  { name: "Tonton Alain", role: "S'occupe du DJ et de la musique", emoji: "🎵", done: 1, total: 3, color: "#A855F7" },
  { name: "Papa Koné", role: "Gestion financière et enveloppes", emoji: "💰", done: 0, total: 2, color: "#EC4899" },
];

const ACTIVITY = [
  { who: "Mme Dubois", what: 'a complété "Commander les faire-part"', when: "il y a 2h" },
  { who: "Marc", what: 'a ajouté le prestataire "DJ Maestro"', when: "il y a 5h" },
  { who: "Tonton Alain", what: 'a commenté sur "Choix du DJ"', when: "Hier" },
  { who: "Sophie", what: 'a mis à jour "Studio Lumière → Confirmé"', when: "il y a 2 jours" },
  { who: "Papa Koné", what: "a rejoint l'équipe", when: "il y a 3 jours" },
];

const INVITE_LINK = "misstice.fr/invite/mariage-sophie-marc";

export default function EquipePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
    setEmail("");
    setRole("");
    setTimeout(() => setSent(false), 3000);
  };

  const copy = () => {
    navigator.clipboard?.writeText(`https://${INVITE_LINK}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Équipe
      </h1>
      <p className="mt-1 text-sm text-slate">
        {MEMBERS.length} collaborateurs · Mariage de Sophie &amp; Marc
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Membres */}
        <div className="space-y-3 lg:col-span-2">
          {MEMBERS.map((m) => {
            const pct = Math.round((m.done / m.total) * 100);
            return (
              <div key={m.name} className="rounded-3xl border border-black/5 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-semibold text-white"
                      style={{ background: m.color }}
                    >
                      {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <div>
                      <p className="font-display text-base font-semibold text-plum">
                        {m.name}
                      </p>
                      <p className="text-sm text-slate">{m.role}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-cream px-2.5 py-1 text-xs font-medium text-plum">
                    {m.emoji} {m.role.split(" ")[0]}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: m.color }}
                    />
                  </div>
                  <span className="text-xs text-slate">
                    {m.done}/{m.total} tâches · {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fil d'activité */}
        <div className="rounded-3xl border border-black/5 bg-white p-6">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-violet" />
            <h2 className="font-display text-lg font-semibold text-plum">
              Fil d&apos;activité
            </h2>
          </div>
          <ul className="mt-4 space-y-4">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet" />
                <div>
                  <p className="text-plum">
                    <span className="font-semibold">{a.who}</span> {a.what}
                  </p>
                  <p className="text-xs text-slate">{a.when}</p>
                </div>
              </li>
            ))}
          </ul>
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
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
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
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet py-3.5 text-base font-semibold text-white hover:bg-violet-dark"
          >
            {sent ? (
              <>
                <Check size={18} /> Invitation envoyée !
              </>
            ) : (
              <>
                <Send size={17} /> Envoyer l&apos;invitation
              </>
            )}
          </button>
        </form>

        {/* Lien d'invitation */}
        <div className="mt-5 border-t border-black/5 pt-5">
          <p className="text-center text-sm text-slate">
            Ou partagez le lien d&apos;invitation
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-black/10 bg-cream p-1.5 pl-4">
            <span className="flex-1 truncate font-mono text-sm text-plum">
              {INVITE_LINK}
            </span>
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet px-3 py-2 text-sm font-semibold text-white hover:bg-violet-dark"
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate">
            Toute personne avec ce lien pourra demander à rejoindre votre équipe.
          </p>
        </div>
      </div>
    </div>
  );
}
