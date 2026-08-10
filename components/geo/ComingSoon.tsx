"use client";

import { useState } from "react";
import { MapPin, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * État affiché sur une page ville/catégorie sous le seuil de publication
 * (voir lib/geo.ts, MIN_VERIFIED_VENDORS). Jamais un 404 sec, jamais de
 * redirection : on capte l'intérêt réel pour prioriser objectivement les
 * prochaines ouvertures (table public.geo_waitlist).
 */
export default function ComingSoon({
  cityName,
  cityLabel,
  categoryLabel,
  eventTypeLabel,
}: {
  cityName: string;
  /** Ex. "à Lyon" — déjà accordé, prêt à insérer dans une phrase. */
  cityLabel: string;
  /** Métier de prestataire (ex. "Traiteur") — pages /prestataires/ville/[ville]/[categorie]. */
  categoryLabel?: string;
  /** Type d'événement (ex. "Mariage") — pages /[evenement]/[ville]. Ne pas
   * confondre avec categoryLabel : "Pas encore de mariage vérifié" n'a pas
   * de sens, contrairement à "Pas encore de traiteur vérifié". */
  eventTypeLabel?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.from("geo_waitlist").insert({
      email: email.trim(),
      city_slug: cityName,
      category: categoryLabel ?? null,
      event_type: eventTypeLabel ?? null,
    });
    setStatus(error ? "error" : "done");
  }

  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-soft text-violet">
        <MapPin size={26} strokeWidth={1.75} />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold text-plum">
        {categoryLabel
          ? `Pas encore de ${categoryLabel.toLowerCase()} vérifié ${cityLabel}`
          : eventTypeLabel
            ? `Pas encore de prestataire vérifié pour un ${eventTypeLabel.toLowerCase()} ${cityLabel}`
            : `Bientôt disponible ${cityLabel}`}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        Nos équipes ajoutent régulièrement de nouveaux prestataires vérifiés.
        Laissez votre email pour être prévenu·e dès qu&apos;il y en aura {cityLabel}.
      </p>

      {status === "done" ? (
        <p className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-soft px-4 py-3 text-sm font-medium text-emerald">
          <CheckCircle2 size={18} />
          Merci, on vous préviendra !
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-xl border border-black/10 py-3 pl-10 pr-3 text-sm text-plum outline-none focus:border-violet/40"
            />
          </div>
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex items-center justify-center rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-60"
          >
            {status === "sending" ? "Envoi…" : "Être prévenu·e"}
          </button>
        </form>
      )}
      {status === "error" && (
        <p className="mt-3 text-xs text-festif">Une erreur est survenue, réessayez.</p>
      )}

      <a href="/creer" className="mt-6 inline-block text-sm font-semibold text-violet hover:text-violet-dark">
        Créer mon événement quand même →
      </a>
    </div>
  );
}
