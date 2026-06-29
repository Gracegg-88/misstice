"use client";

import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  MapPin,
  Clock,
  Heart,
  MessageSquare,
  CalendarPlus,
  Lock,
  X,
  Check,
  Quote,
  ShieldCheck,
  Send,
} from "lucide-react";
import type { Vendor } from "./vendors";
import type { Pkg, Review } from "./profileData";
import { GALLERY_GRADS } from "./profileData";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= Math.round(value)
              ? "fill-festif text-festif"
              : "text-black/15"
          }
        />
      ))}
    </span>
  );
}

const MOCK_EVENTS = [
  "Mariage Awa & Karim · 14 juin",
  "Anniversaire 60 ans de Maman · 3 août",
  "Baptême de Noé · 21 septembre",
];

export default function VendorProfile({
  vendor,
  packages,
  reviews,
  breakdown,
}: {
  vendor: Vendor;
  packages: Pkg[];
  reviews: Review[];
  breakdown: { stars: number; pct: number }[];
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [saved, setSaved] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [addedEvent, setAddedEvent] = useState<string | null>(null);

  return (
    <div className="bg-cream">
      {/* Barre de démo (remplacée par NextAuth plus tard) */}
      <div className="border-b border-violet/15 bg-violet-soft">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3 px-5 py-2.5 text-sm sm:px-8">
          <span className="text-violet">
            Mode démo — {loggedIn ? "vous êtes connecté" : "vous êtes déconnecté"}
          </span>
          <button
            onClick={() => setLoggedIn((v) => !v)}
            className="rounded-lg border border-violet/30 px-3 py-1 text-xs font-semibold text-violet hover:bg-white"
          >
            {loggedIn ? "Se déconnecter" : "Simuler la connexion"}
          </button>
        </div>
      </div>

      {/* Couverture */}
      <div className={`relative h-48 bg-gradient-to-br ${vendor.grad} sm:h-64`}>
        <div className="mx-auto max-w-content px-5 pt-5 sm:px-8">
          <a
            href="/prestataires"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-sm font-medium text-plum hover:bg-white"
          >
            <ArrowLeft size={16} />
            Retour
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-content px-5 sm:px-8">
        {/* En-tête profil (chevauche la couverture) */}
        <div className="-mt-16 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div
                className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${vendor.grad} font-display text-3xl font-semibold text-white shadow-md`}
              >
                {vendor.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-festif">
                  {vendor.category}
                </p>
                <h1 className="font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
                  {vendor.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate">
                  <span className="inline-flex items-center gap-1 font-semibold text-plum">
                    <Star size={15} className="fill-festif text-festif" />
                    {vendor.rating.toFixed(1)}
                  </span>
                  <span>({vendor.reviews} avis)</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} />
                    {vendor.city}
                  </span>
                  {vendor.verified && (
                    <span className="inline-flex items-center gap-1 font-medium text-violet">
                      <BadgeCheck size={15} />
                      Vérifié par Misstice
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
              onClick={() => setSaved((v) => !v)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                saved
                  ? "border-violet bg-violet text-white"
                  : "border-black/10 text-plum hover:border-violet/40"
              }`}
            >
              <Heart size={18} className={saved ? "fill-white" : ""} />
            </button>
          </div>

          {/* Actions principales */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setQuoteOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-violet-dark"
            >
              <MessageSquare size={18} />
              Demander un devis
            </button>
            <button
              onClick={() => setEventOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-plum/15 bg-white px-6 py-3.5 text-base font-semibold text-plum transition-colors hover:border-plum/30"
            >
              <CalendarPlus size={18} />
              {addedEvent ? "Ajouté à votre événement ✓" : "Ajouter à mon événement"}
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="space-y-10 lg:col-span-2">
            {/* À propos */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-plum">
                À propos
              </h2>
              <p className="mt-3 leading-relaxed text-slate">
                {vendor.tagline} Basé à {vendor.city}, {vendor.name} accompagne
                familles et particuliers pour des événements à la hauteur de vos
                attentes. Langues parlées : {vendor.languages.join(", ")}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {vendor.languages.map((l) => (
                  <span
                    key={l}
                    className="rounded-lg bg-violet-soft px-2.5 py-1 text-xs font-medium text-violet"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </section>

            {/* Forfaits */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-plum">
                Services &amp; tarifs
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {packages.map((p) => (
                  <div
                    key={p.name}
                    className={`relative rounded-2xl border bg-white p-5 ${
                      p.popular ? "border-violet" : "border-black/5"
                    }`}
                  >
                    {p.popular && (
                      <span className="absolute -top-2.5 left-5 rounded-full bg-violet px-2.5 py-0.5 text-xs font-semibold text-white">
                        Populaire
                      </span>
                    )}
                    <p className="font-display text-lg font-semibold text-plum">
                      {p.name}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-violet">
                      {p.price}
                    </p>
                    <ul className="mt-3 space-y-2">
                      {p.features.map((f) => (
                        <li
                          key={f}
                          className="flex items-start gap-2 text-sm text-slate"
                        >
                          <Check
                            size={15}
                            className="mt-0.5 shrink-0 text-emerald"
                          />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Le Book — réservé aux membres connectés */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-plum">
                  Le book de {vendor.name}
                </h2>
                {loggedIn && (
                  <span className="text-sm text-slate">
                    {GALLERY_GRADS.length} réalisations
                  </span>
                )}
              </div>

              {loggedIn ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {GALLERY_GRADS.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(i)}
                      className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${g} transition-transform hover:scale-[1.02]`}
                      aria-label={`Agrandir la réalisation ${i + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-black/5">
                  <div className="grid grid-cols-3 gap-3 p-3 blur-sm">
                    {GALLERY_GRADS.slice(0, 6).map((g, i) => (
                      <div
                        key={i}
                        className={`aspect-[4/3] rounded-xl bg-gradient-to-br ${g}`}
                      />
                    ))}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 text-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet text-white">
                      <Lock size={22} />
                    </span>
                    <p className="mt-3 font-display text-lg font-semibold text-plum">
                      Le book est réservé aux membres
                    </p>
                    <p className="mt-1 max-w-xs text-sm text-slate">
                      Connectez-vous gratuitement pour voir toutes les
                      réalisations de {vendor.name}.
                    </p>
                    <button
                      onClick={() => setLoggedIn(true)}
                      className="mt-4 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark"
                    >
                      Se connecter pour voir le book
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Avis */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-plum">
                Avis ({vendor.reviews})
              </h2>

              {/* Résumé + répartition */}
              <div className="mt-4 flex flex-col gap-6 rounded-2xl border border-black/5 bg-white p-6 sm:flex-row sm:items-center">
                <div className="text-center sm:w-40 sm:shrink-0">
                  <p className="font-display text-5xl font-semibold text-plum">
                    {vendor.rating.toFixed(1)}
                  </p>
                  <Stars value={vendor.rating} />
                  <p className="mt-1 text-sm text-slate">
                    {vendor.reviews} avis vérifiés
                  </p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {breakdown.map((b) => (
                    <div key={b.stars} className="flex items-center gap-2">
                      <span className="w-3 text-sm text-slate">{b.stars}</span>
                      <Star size={13} className="fill-festif text-festif" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                        <div
                          className="h-full rounded-full bg-festif"
                          style={{ width: `${b.pct}%` }}
                        />
                      </div>
                      <span className="w-9 text-right text-xs text-slate">
                        {b.pct}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transparence */}
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-slate">
                <ShieldCheck size={15} className="text-emerald" />
                Tous les avis vérifiés sont publiés, positifs comme négatifs.
                Aucun avis n&apos;est supprimé contre paiement.
              </p>

              {/* Liste des avis */}
              <div className="mt-5 space-y-4">
                {reviews.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-black/5 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-soft font-semibold text-violet">
                          {r.initial}
                        </span>
                        <div>
                          <p className="font-semibold text-plum">{r.author}</p>
                          <p className="text-xs text-slate">
                            {r.event} · {r.date} ·{" "}
                            <span className="text-emerald">avis vérifié</span>
                          </p>
                        </div>
                      </div>
                      <Stars value={r.rating} size={14} />
                    </div>
                    <p className="mt-3 leading-relaxed text-slate">{r.text}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Aside sticky */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-3xl border border-black/5 bg-white p-6">
                <p className="flex items-baseline gap-1">
                  <span className="font-display text-2xl font-semibold text-plum">
                    {vendor.priceFrom}
                  </span>
                </p>
                <div className="mt-4 space-y-2.5 text-sm">
                  <p className="flex items-center justify-between">
                    <span className="text-slate">Note</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-plum">
                      <Star size={14} className="fill-festif text-festif" />
                      {vendor.rating.toFixed(1)} ({vendor.reviews})
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate">Réponse</span>
                    <span className="inline-flex items-center gap-1 font-medium text-plum">
                      <Clock size={14} />~{vendor.responseHours}h ·{" "}
                      {vendor.responseRate}%
                    </span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-slate">Langues</span>
                    <span className="text-right font-medium text-plum">
                      {vendor.languages.join(", ")}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setQuoteOpen(true)}
                  className="mt-5 w-full rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white hover:bg-violet-dark"
                >
                  Demander un devis
                </button>
                <button
                  onClick={() => setEventOpen(true)}
                  className="mt-2.5 w-full rounded-2xl border border-plum/15 px-6 py-3 text-sm font-semibold text-plum hover:border-plum/30"
                >
                  Ajouter à mon événement
                </button>
                <p className="mt-4 text-center text-xs text-slate">
                  Devis gratuit et sans engagement.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="h-16" />

      {/* ── Lightbox book ── */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-plum/80 p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            aria-label="Fermer"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <X size={20} />
          </button>
          <div
            className={`aspect-[4/3] w-full max-w-3xl rounded-3xl bg-gradient-to-br ${GALLERY_GRADS[lightbox]}`}
          />
        </div>
      )}

      {/* ── Modale devis ── */}
      {quoteOpen && (
        <Modal onClose={() => setQuoteOpen(false)} title={`Demander un devis — ${vendor.name}`}>
          <QuoteForm loggedIn={loggedIn} onDone={() => setQuoteOpen(false)} />
        </Modal>
      )}

      {/* ── Modale ajouter à un événement ── */}
      {eventOpen && (
        <Modal onClose={() => setEventOpen(false)} title="Ajouter à mon événement">
          {loggedIn ? (
            <EventPicker
              onConfirm={(ev) => {
                setAddedEvent(ev);
                setEventOpen(false);
              }}
            />
          ) : (
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet text-white">
                <Lock size={22} />
              </span>
              <p className="mt-3 font-semibold text-plum">
                Connectez-vous pour ajouter ce prestataire
              </p>
              <p className="mt-1 text-sm text-slate">
                Il faut un compte pour rattacher un prestataire à votre
                événement.
              </p>
              <button
                onClick={() => setLoggedIn(true)}
                className="mt-4 w-full rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
              >
                Se connecter
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* Confirmation d'ajout */}
      {addedEvent && (
        <div className="fixed bottom-5 left-1/2 z-[80] -translate-x-1/2 rounded-2xl bg-plum px-5 py-3 text-sm text-white shadow-lg">
          <span className="inline-flex items-center gap-2">
            <Check size={16} className="text-emerald" />
            {vendor.name} ajouté à « {addedEvent} »
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Sous-composants ── */

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-plum/50 p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 sm:rounded-3xl sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-plum">
            {title}
          </h3>
          <button
            aria-label="Fermer"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream text-plum"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function QuoteForm({
  loggedIn,
  onDone,
}: {
  loggedIn: boolean;
  onDone: () => void;
}) {
  const [sent, setSent] = useState(false);
  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  if (sent) {
    return (
      <div className="py-6 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-soft text-emerald">
          <Check size={24} />
        </span>
        <p className="mt-3 font-display text-lg font-semibold text-plum">
          Demande envoyée !
        </p>
        <p className="mt-1 text-sm text-slate">
          Le prestataire vous répondra directement. Vous recevrez une
          notification.
        </p>
        <button
          onClick={onDone}
          className="mt-5 w-full rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="space-y-4"
    >
      {!loggedIn && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-plum">Votre nom</label>
            <input required className={`mt-1.5 ${inputCls}`} placeholder="Prénom Nom" />
          </div>
          <div>
            <label className="text-sm font-medium text-plum">Email</label>
            <input required type="email" className={`mt-1.5 ${inputCls}`} placeholder="vous@email.com" />
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-plum">
            Type d&apos;événement
          </label>
          <select required className={`mt-1.5 ${inputCls}`} defaultValue="">
            <option value="" disabled>
              Choisir…
            </option>
            <option>Mariage</option>
            <option>Anniversaire</option>
            <option>Baptême</option>
            <option>Gala / soirée</option>
            <option>Autre</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-plum">Date</label>
          <input type="date" className={`mt-1.5 ${inputCls}`} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-plum">
          Nombre d&apos;invités
        </label>
        <input type="number" min={1} className={`mt-1.5 ${inputCls}`} placeholder="ex. 80" />
      </div>
      <div>
        <label className="text-sm font-medium text-plum">Message</label>
        <textarea
          required
          rows={3}
          className={`mt-1.5 ${inputCls}`}
          placeholder="Décrivez votre projet, vos attentes, votre budget…"
        />
      </div>
      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white hover:bg-violet-dark"
      >
        <Send size={17} />
        Envoyer la demande
      </button>
    </form>
  );
}

function EventPicker({ onConfirm }: { onConfirm: (ev: string) => void }) {
  const [choice, setChoice] = useState(MOCK_EVENTS[0]);
  return (
    <div>
      <p className="text-sm text-slate">
        À quel événement voulez-vous rattacher ce prestataire ?
      </p>
      <div className="mt-4 space-y-2">
        {MOCK_EVENTS.map((ev) => (
          <label
            key={ev}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
              choice === ev
                ? "border-violet bg-violet-soft text-violet"
                : "border-black/10 text-plum hover:border-violet/40"
            }`}
          >
            <input
              type="radio"
              name="event"
              checked={choice === ev}
              onChange={() => setChoice(ev)}
              className="accent-violet"
            />
            {ev}
          </label>
        ))}
      </div>
      <button
        onClick={() => onConfirm(choice)}
        className="mt-5 w-full rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white hover:bg-violet-dark"
      >
        Ajouter à cet événement
      </button>
    </div>
  );
}
