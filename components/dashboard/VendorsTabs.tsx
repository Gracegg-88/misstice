"use client";

import { useState } from "react";
import { Store, Heart } from "lucide-react";
import BookedVendorsClient from "@/components/dashboard/BookedVendorsClient";
import FavoriteVendorsClient from "@/components/dashboard/FavoriteVendorsClient";
import type { EventVendor } from "@/lib/dashboard-types";

export default function VendorsTabs({
  eventId,
  initial,
}: {
  eventId: string | null;
  initial: EventVendor[];
}) {
  const [tab, setTab] = useState<"event" | "favoris">("event");

  const tabCls = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "bg-violet text-white" : "bg-white text-slate hover:text-plum"
    }`;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab("event")}
          className={tabCls(tab === "event")}
        >
          <Store size={16} />
          Sur l&apos;événement
        </button>
        <button
          type="button"
          onClick={() => setTab("favoris")}
          className={tabCls(tab === "favoris")}
        >
          <Heart size={16} />
          Favoris
        </button>
      </div>

      <div className="mt-6">
        {tab === "event" ? (
          eventId ? (
            <BookedVendorsClient key={eventId} eventId={eventId} initial={initial} />
          ) : (
            <div className="rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center">
              <p className="text-sm text-slate">
                Créez un événement pour suivre vos prestataires. Vos favoris
                restent disponibles dans l&apos;onglet « Favoris ».
              </p>
            </div>
          )
        ) : (
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
              Mes favoris
            </h1>
            <FavoriteVendorsClient />
          </div>
        )}
      </div>
    </div>
  );
}
