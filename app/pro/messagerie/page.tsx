"use client";

import { useState } from "react";
import { Send } from "lucide-react";

const CONVOS = [
  { id: 1, name: "Awa & Karim", initials: "AK", last: "Parfait, on confirme pour le 14 !", time: "10:24", unread: true },
  { id: 2, name: "Sophie & Marc", initials: "SM", last: "Vous faites aussi les séances couple ?", time: "Hier", unread: true },
  { id: 3, name: "Christelle N.", initials: "CN", last: "Merci beaucoup, à bientôt 🙏", time: "Lun", unread: false },
];

const THREAD = [
  { me: false, text: "Bonjour ! On adore votre book. Disponible le 14 juin ?", time: "09:58" },
  { me: true, text: "Bonjour Awa ! Oui, le 14 juin est disponible. Je vous prépare un devis journée complète.", time: "10:05" },
  { me: false, text: "Parfait, on confirme pour le 14 !", time: "10:24" },
];

export default function ProMessagerie() {
  const [active, setActive] = useState(1);
  const convo = CONVOS.find((c) => c.id === active)!;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Messagerie
      </h1>
      <p className="mt-1 text-sm text-slate">
        Échangez avec les familles, directement sur Misstice.
      </p>

      <div className="mt-6 grid h-[520px] overflow-hidden rounded-3xl border border-black/5 bg-white md:grid-cols-[280px_1fr]">
        {/* Liste */}
        <div className="border-b border-black/5 md:border-b-0 md:border-r">
          <ul>
            {CONVOS.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActive(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left transition-colors ${
                    active === c.id ? "bg-violet-soft" : "hover:bg-cream"
                  }`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-soft text-sm font-semibold text-violet">
                    {c.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between">
                      <span className="truncate text-sm font-semibold text-plum">{c.name}</span>
                      <span className="text-xs text-slate">{c.time}</span>
                    </span>
                    <span className="block truncate text-xs text-slate">{c.last}</span>
                  </span>
                  {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-festif" />}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Fil */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-black/5 px-5 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-soft text-sm font-semibold text-violet">
              {convo.initials}
            </span>
            <p className="font-semibold text-plum">{convo.name}</p>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {THREAD.map((m, i) => (
              <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.me ? "bg-violet text-white" : "bg-cream text-plum"
                  }`}
                >
                  {m.text}
                  <span className={`mt-1 block text-[11px] ${m.me ? "text-white/70" : "text-slate"}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-black/5 p-3">
            <input
              placeholder="Écrire un message…"
              className="flex-1 rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
            />
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet text-white hover:bg-violet-dark">
              <Send size={17} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
