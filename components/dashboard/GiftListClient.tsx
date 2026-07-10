"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Plus,
  X,
  Search,
  ExternalLink,
  Trash2,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { GiftItem } from "@/lib/dashboard-types";
import ReadOnlyBanner from "@/components/dashboard/ReadOnlyBanner";

export default function GiftListClient({
  eventId,
  eventName,
  initial,
  canEdit = true,
}: {
  eventId: string;
  eventName: string;
  initial: GiftItem[];
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<GiftItem[]>(initial);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", url: "", price: "", note: "" });

  const reserved = items.filter((i) => i.reserved).length;

  const shown = items.filter((i) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [i.title, i.note, i.url].some((v) =>
      (v ?? "").toLowerCase().includes(q)
    );
  });

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const title = form.title.trim();
    if (!title || saving) return;
    setSaving(true);
    setError("");
    const supabase = createClient();
    const position =
      items.reduce((m, i) => Math.max(m, i.position), 0) + 1;
    const { data, error: insErr } = await supabase
      .from("gift_items")
      .insert({
        event_id: eventId,
        title,
        url: form.url.trim() || null,
        price: form.price.trim() || null,
        note: form.note.trim() || null,
        position,
      })
      .select("id, event_id, title, url, price, note, reserved, position")
      .single();
    setSaving(false);
    if (insErr || !data) {
      setError(insErr?.message ?? "Erreur lors de l'ajout.");
      return;
    }
    setItems((p) => [...p, data as GiftItem]);
    setForm({ title: "", url: "", price: "", note: "" });
    setOpen(false);
    router.refresh();
  };

  const toggleReserved = async (item: GiftItem) => {
    if (!canEdit) return;
    const next = !item.reserved;
    setItems((p) =>
      p.map((x) => (x.id === item.id ? { ...x, reserved: next } : x))
    );
    const supabase = createClient();
    const { error: upErr } = await supabase
      .from("gift_items")
      .update({ reserved: next })
      .eq("id", item.id);
    if (upErr) {
      setItems((p) =>
        p.map((x) => (x.id === item.id ? { ...x, reserved: item.reserved } : x))
      );
      return;
    }
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!canEdit) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("gift_items")
      .delete()
      .eq("id", id);
    if (delErr) {
      setItems(prev);
      return;
    }
    router.refresh();
  };

  // Domaine du lien (ex. amazon.fr) pour un rendu propre.
  const hostOf = (url: string | null): string | null => {
    if (!url) return null;
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Liste cadeau
          </h1>
          <p className="mt-1 text-sm text-slate">
            {items.length} idée{items.length > 1 ? "s" : ""} · {reserved} réservée
            {reserved > 1 ? "s" : ""} · {eventName}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
          >
            <Plus size={16} />
            Ajouter une idée
          </button>
        )}
      </div>
      {!canEdit && (
        <div className="mt-5">
          <ReadOnlyBanner section="la liste cadeau" />
        </div>
      )}

      {/* Recherche */}
      {items.length > 0 && (
        <div className="relative mt-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une idée…"
            className="w-full rounded-2xl border border-black/10 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-violet"
          />
        </div>
      )}

      {/* Liste */}
      <div className="mt-4 space-y-3">
        {items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-black/10 bg-white p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
              <Gift size={22} />
            </div>
            <p className="mt-3 font-display text-base font-semibold text-plum">
              Aucune idée cadeau
            </p>
            <p className="mt-1 text-sm text-slate">
              Ajoutez des idées avec un lien Fnac, Amazon, etc.
            </p>
          </div>
        )}
        {shown.map((i) => {
          const host = hostOf(i.url);
          return (
            <div
              key={i.id}
              className={`flex items-center gap-4 rounded-3xl border bg-white p-4 sm:p-5 ${
                i.reserved ? "border-emerald/30" : "border-black/5"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  i.reserved
                    ? "bg-emerald-soft text-emerald"
                    : "bg-violet-soft text-violet"
                }`}
              >
                <Gift size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-display text-base font-semibold ${
                    i.reserved ? "text-slate line-through" : "text-plum"
                  }`}
                >
                  {i.title}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate">
                  {i.price && <span>{i.price}</span>}
                  {i.url && (
                    <a
                      href={i.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-violet hover:underline"
                    >
                      <ExternalLink size={13} />
                      {host ?? "Voir le produit"}
                    </a>
                  )}
                  {i.note && <span className="text-slate/80">· {i.note}</span>}
                </div>
              </div>
              {canEdit && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleReserved(i)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      i.reserved
                        ? "border-emerald/40 bg-emerald-soft text-emerald"
                        : "border-black/10 text-slate hover:border-violet/40 hover:text-plum"
                    }`}
                  >
                    <Check size={14} />
                    {i.reserved ? "Réservé" : "Marquer réservé"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i.id)}
                    aria-label={`Supprimer ${i.title}`}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate hover:bg-cream hover:text-festif"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {items.length > 0 && shown.length === 0 && (
          <p className="rounded-3xl border border-dashed border-black/10 bg-white py-10 text-center text-sm text-slate">
            Aucune idée ne correspond à votre recherche.
          </p>
        )}
      </div>

      {/* Modale d'ajout */}
      {open && canEdit && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 sm:items-center sm:p-6">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-plum">
                Nouvelle idée cadeau
              </h3>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={add} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-plum">Intitulé</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="ex. Service à raclette"
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-plum">
                  Lien externe (Fnac, Amazon…)
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://…"
                  className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-plum">Prix</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="ex. 45 €"
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-plum">Note</label>
                  <input
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    placeholder="ex. coloris gris"
                    className="mt-1.5 w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm outline-none focus:border-violet"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-festif">{error}</p>}
              <button
                type="submit"
                disabled={saving || !form.title.trim()}
                className="w-full rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
              >
                {saving ? "Ajout…" : "Ajouter à la liste"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
