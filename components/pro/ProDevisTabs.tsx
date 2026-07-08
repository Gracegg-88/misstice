"use client";

import { useState } from "react";
import { Inbox, FileText } from "lucide-react";
import DemandesClient from "@/components/pro/DemandesClient";
import DevisClient from "@/components/pro/DevisClient";
import type { ConversationListItem } from "@/lib/messaging-types";
import type { Quote } from "@/lib/pro-types";

export default function ProDevisTabs({
  convs,
  quotes,
  initialTab = "demandes",
}: {
  convs: ConversationListItem[];
  quotes: Quote[];
  initialTab?: "demandes" | "devis";
}) {
  const [tab, setTab] = useState<"demandes" | "devis">(initialTab);

  const tabs = [
    { key: "demandes" as const, label: "Demandes de devis", icon: Inbox, count: convs.length },
    { key: "devis" as const, label: "Mes devis", icon: FileText, count: quotes.length },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
        Devis
      </h1>
      <p className="mt-1 text-sm text-slate">
        Vos demandes entrantes et les devis que vous avez envoyés.
      </p>

      {/* Onglets */}
      <div className="mt-5 inline-flex flex-wrap gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/5">
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-violet text-white" : "text-slate hover:text-plum"
              }`}
            >
              <t.icon size={16} />
              {t.label}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  active ? "bg-white/20 text-white" : "bg-cream text-slate"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "demandes" ? (
          <DemandesClient convs={convs} quotes={quotes} embedded />
        ) : (
          <DevisClient quotes={quotes} embedded />
        )}
      </div>
    </div>
  );
}
