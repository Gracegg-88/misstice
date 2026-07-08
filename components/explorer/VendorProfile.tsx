"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  BadgeCheck,
  Star,
  MapPin,
  Heart,
  MessageSquare,
  CalendarPlus,
  Lock,
  X,
  Check,
  Send,
  Euro,
} from "lucide-react";
import type { Vendor } from "./vendors";
import type { Pkg, Review } from "./profileData";
import { GALLERY_GRADS } from "./profileData";
import { quoteFields, demandeItems } from "@/lib/quote-fields";
import { useFavorites } from "@/lib/useFavorites";

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


export default function VendorProfile({
  vendor,
  packages,
  reviews,
  breakdown,
  photos = [],
}: {
  vendor: Vendor;
  packages: Pkg[];
  reviews: Review[];
  breakdown: { stars: number; pct: number }[];
  photos?: string[];
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const { has: favHas, toggle: favToggle } = useFavorites();
  const saved = favHas(vendor.id);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [addedEvent, setAddedEvent] = useState<string | null>(null);
  const [myEvents, setMyEvents] = useState<{ id: string; name: string }[]>([]);
  const [addErr, setAddErr] = useState("");

  // Vraie session + événements de l'utilisateur (pour « Ajouter à mon événement »).
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setLoggedIn(false);
        return;
      }
      setLoggedIn(true);
      const { data } = await supabase.from("events").select("id, name");
      setMyEvents((data as { id: string; name: string }[]) ?? []);
    });
  }, []);

  // Rattache réellement le prestataire à l'événement choisi.
  const addToEvent = async (eventId: string, eventName: string) => {
    setAddErr("");
    const supabase = createClient();
    const { error } = await supabase.from("event_vendors").insert({
      event_id: eventId,
      vendor_id: vendor.id,
      name: vendor.name,
      category: vendor.category,
      status: "en attente",
    });
    if (error) {
      setAddErr(error.message);
      return;
    }
    setAddedEvent(eventName);
    setEventOpen(false);
  };

  // Comptabilise une vue de fiche (une fois par session), pour les stats pro.
  // Uniquement pour les fiches liées à un compte (les démos ne comptent pas).
  useEffect(() => {
    if (typeof window === "undefined" || !vendor.userId) return;
    const key = `pv-${vendor.id}`;
    if (sessionStorage.getItem(key)) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      // Le prestataire ne compte pas ses propres visites sur sa fiche.
      if (user?.id === vendor.userId) return;
      sessionStorage.setItem(key, "1");
      supabase
        .from("profile_views")
        .insert({ vendor_id: vendor.id })
        .then(({ error }) => {
          if (error) {
            // Échec → nouvelle tentative possible au prochain chargement.
            sessionStorage.removeItem(key);
            console.error("profile_views insert:", error.message);
          }
        });
    });
  }, [vendor.id, vendor.userId]);

  return (
    <div className="bg-cream">
      {/* Hero / cover — infos posées sur l'image */}
      <div
        className="relative overflow-hidden bg-cream bg-cover bg-center"
        style={{ backgroundImage: "url('/hero_details.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-transparent" />
        <div className="relative mx-auto max-w-content px-5 py-8 sm:px-8">
          <a
            href="/prestataires"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-1.5 text-sm font-medium text-plum shadow-sm hover:bg-white"
          >
            <ArrowLeft size={16} />
            Retour
          </a>

          <div className="mt-8 flex items-start justify-between gap-6">
            <div className="min-w-0 max-w-2xl flex-1">
              <div className="flex items-end gap-4">
                {vendor.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={vendor.img}
                    alt={vendor.name}
                    className="h-20 w-20 shrink-0 rounded-3xl object-cover shadow-md sm:h-24 sm:w-24"
                  />
                ) : (
                  <div
                    className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br ${vendor.grad} font-display text-2xl font-semibold text-white shadow-md sm:h-24 sm:w-24 sm:text-3xl`}
                  >
                    {vendor.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
                    {vendor.name}
                  </h1>
                  <p className="mt-0.5 text-slate">
                    {vendor.category} événementiel
                  </p>
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
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-plum/15 bg-white/80 px-6 py-3.5 text-base font-semibold text-plum backdrop-blur-sm transition-colors hover:border-plum/30"
                >
                  <CalendarPlus size={18} />
                  {addedEvent ? "Ajouté à votre événement ✓" : "Ajouter à mon événement"}
                </button>
              </div>
            </div>

            <button
              aria-label={saved ? "Retirer des favoris" : "Sauvegarder"}
              onClick={() => favToggle(vendor.id)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-sm transition-colors ${
                saved
                  ? "border-violet bg-violet text-white"
                  : "border-black/10 bg-white/80 text-plum hover:border-violet/40"
              }`}
            >
              <Heart size={18} className={saved ? "fill-white" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-content px-5 pt-8 sm:px-8">
        {/* Stat cards */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { icon: Euro, label: "À partir de", value: vendor.priceFrom.replace("dès ", ""), tint: "bg-festif-soft text-festif" },
            { icon: Star, label: "Avis vérifiés", value: String(vendor.reviews), tint: "bg-festif-soft text-festif" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tint}`}>
                <s.icon size={18} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-slate">{s.label}</p>
                <p className="truncate font-display text-base font-semibold text-plum">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="space-y-10 lg:col-span-2">
            {/* À propos */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-plum">
                À propos
              </h2>
              {vendor.about ? (
                <p className="mt-3 whitespace-pre-wrap leading-relaxed text-slate">
                  {vendor.about}
                </p>
              ) : (
                <p className="mt-3 leading-relaxed text-slate">
                  {vendor.tagline} Basé à {vendor.city}, {vendor.name} accompagne
                  familles et particuliers pour des événements à la hauteur de
                  vos attentes.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {["Mariage", "Anniversaire", "Baptême", "Gala"].map((t) => (
                  <span
                    key={t}
                    className="rounded-lg bg-violet-soft px-2.5 py-1 text-xs font-medium text-violet"
                  >
                    {t}
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
                        Le plus demandé
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
                <span className="text-sm text-slate">
                  {(photos.length || GALLERY_GRADS.length)} réalisations
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.length > 0
                  ? photos.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightbox(i)}
                        className="overflow-hidden rounded-2xl transition-transform hover:scale-[1.02]"
                        aria-label={`Agrandir la réalisation ${i + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Réalisation ${i + 1}`}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      </button>
                    ))
                  : GALLERY_GRADS.map((g, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightbox(i)}
                        className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${g} transition-transform hover:scale-[1.02]`}
                        aria-label={`Agrandir la réalisation ${i + 1}`}
                      />
                    ))}
              </div>
            </section>

            {/* Avis */}
            <section>
              <h2 className="font-display text-2xl font-semibold text-plum">
                Avis{vendor.reviews > 0 ? ` (${vendor.reviews})` : ""}
              </h2>

              {vendor.reviews > 0 ? (
                <>
                  {/* Résumé + répartition */}
                  <div className="mt-4 flex flex-col gap-6 rounded-2xl border border-black/5 bg-white p-6 sm:flex-row sm:items-center">
                    <div className="text-center sm:w-40 sm:shrink-0">
                      <p className="font-display text-5xl font-semibold text-plum">
                        {vendor.rating.toFixed(1)}
                      </p>
                      <Stars value={vendor.rating} />
                      <p className="mt-1 text-sm text-slate">
                        {vendor.reviews} avis
                      </p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {breakdown.map((b) => (
                        <div key={b.stars} className="flex items-center gap-2">
                          <span className="w-3 text-sm text-slate">
                            {b.stars}
                          </span>
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

                  {/* Liste des avis */}
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {reviews.map((r, i) => (
                      <div
                        key={i}
                        className="rounded-2xl border border-black/5 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-sm font-semibold text-violet">
                              {r.initial}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-plum">
                                {r.author}
                              </p>
                              <p className="text-xs text-slate">
                                {r.event} · {r.date}
                              </p>
                            </div>
                          </div>
                          <Stars value={r.rating} size={13} />
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate">
                          {r.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-black/10 bg-white p-6 text-center text-sm text-slate">
                  Aucun avis pour l&apos;instant. Soyez le premier à partager
                  votre expérience&nbsp;!
                </p>
              )}

              {/* Laisser un avis (particuliers uniquement) */}
              <ReviewForm vendorId={vendor.id} />
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
          {photos.length > 0 && photos[lightbox] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photos[lightbox]}
              alt="Réalisation"
              className="max-h-[85vh] w-full max-w-3xl rounded-3xl object-contain"
            />
          ) : (
            <div
              className={`aspect-[4/3] w-full max-w-3xl rounded-3xl bg-gradient-to-br ${
                GALLERY_GRADS[lightbox % GALLERY_GRADS.length]
              }`}
            />
          )}
        </div>
      )}

      {/* ── Modale devis ── */}
      {quoteOpen && (
        <Modal onClose={() => setQuoteOpen(false)} title={`Demander un devis — ${vendor.name}`}>
          <QuoteForm vendor={vendor} onDone={() => setQuoteOpen(false)} />
        </Modal>
      )}

      {/* ── Modale ajouter à un événement ── */}
      {eventOpen && (
        <Modal onClose={() => setEventOpen(false)} title="Ajouter à mon événement">
          {!loggedIn ? (
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
              <a
                href={`/auth?next=/prestataires/${vendor.id}`}
                className="mt-4 inline-block w-full rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
              >
                Se connecter
              </a>
            </div>
          ) : myEvents.length === 0 ? (
            <div className="text-center">
              <p className="font-semibold text-plum">Aucun événement</p>
              <p className="mt-1 text-sm text-slate">
                Créez d&apos;abord un événement pour y rattacher ce prestataire.
              </p>
              <a
                href="/dashboard/nouveau"
                className="mt-4 inline-block w-full rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
              >
                Créer un événement
              </a>
            </div>
          ) : (
            <EventPicker events={myEvents} onConfirm={addToEvent} error={addErr} />
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

function ReviewForm({ vendorId }: { vendorId: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [canReview, setCanReview] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(0);
  const [event, setEvent] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setChecking(false);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();
      const p = prof as { role: string; full_name: string | null } | null;
      if (p?.role === "particulier") {
        setCanReview(true);
        setUserId(user.id);
        setUserName(p.full_name?.trim() ?? "");
      }
      setChecking(false);
    })();
  }, []);

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  if (checking || !canReview) return null;

  if (done) {
    return (
      <p className="mt-6 rounded-2xl bg-emerald-soft p-4 text-center text-sm font-medium text-emerald">
        Merci ! Votre avis a bien été publié.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !body.trim() || sending) return;
    setSending(true);
    setError("");
    const supabase = createClient();
    const { error: insErr } = await supabase.from("reviews").insert({
      vendor_id: vendorId,
      author_id: userId,
      author_name: userName || "Client",
      rating,
      event_type: event.trim() || null,
      body: body.trim(),
    });
    setSending(false);
    if (insErr) {
      setError(
        insErr.code === "23505"
          ? "Vous avez déjà laissé un avis pour ce prestataire."
          : insErr.message
      );
      return;
    }
    setDone(true);
    router.refresh();
  };

  return (
    <div className="mt-6 rounded-2xl border border-black/5 bg-white p-5">
      <h3 className="font-display text-lg font-semibold text-plum">
        Laisser un avis
      </h3>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              aria-label={`${s} étoile${s > 1 ? "s" : ""}`}
            >
              <Star
                size={26}
                className={
                  s <= rating ? "fill-festif text-festif" : "text-black/15"
                }
              />
            </button>
          ))}
        </div>
        <input
          value={event}
          onChange={(e) => setEvent(e.target.value)}
          placeholder="Type d'événement (ex. Mariage)"
          className={inputCls}
        />
        <textarea
          required
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Partagez votre expérience…"
          className={inputCls}
        />
        {error && <p className="text-sm text-festif">{error}</p>}
        <button
          type="submit"
          disabled={sending || !rating || !body.trim()}
          className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Publier mon avis"}
        </button>
      </form>
    </div>
  );
}

function QuoteForm({ vendor, onDone }: { vendor: Vendor; onDone: () => void }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [wanted, setWanted] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const fields = quoteFields(vendor.category);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
      setEmail(user?.email ?? "");
      setChecking(false);
    });
  }, []);

  const inputCls =
    "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet";

  // Fiche démo : pas de compte prestataire → contact indisponible.
  if (!vendor.userId) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-soft text-violet">
          <Lock size={22} />
        </span>
        <p className="mt-3 font-semibold text-plum">Prestataire non inscrit</p>
        <p className="mt-1 text-sm text-slate">
          Cette fiche est une vitrine. Le contact direct sera disponible dès que
          ce prestataire aura rejoint Misstice.
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-5 w-full rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          Fermer
        </button>
      </div>
    );
  }

  if (checking) {
    return <p className="py-6 text-center text-sm text-slate">Chargement…</p>;
  }

  // Non connecté : il faut un compte pour discuter sur le site.
  if (!userId) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet text-white">
          <Lock size={22} />
        </span>
        <p className="mt-3 font-semibold text-plum">
          Connectez-vous pour envoyer votre demande
        </p>
        <p className="mt-1 text-sm text-slate">
          Vous échangerez avec le prestataire directement sur Misstice.
        </p>
        <a
          href={`/auth?next=/prestataires/${vendor.id}`}
          className="mt-4 inline-block w-full rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
        >
          Se connecter
        </a>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setError("");
    const supabase = createClient();

    // Prestations explicitement demandées par le client (une par ligne).
    const wantedItems = wanted
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((label) => ({ label, description: "", qty: 1 }));

    // Champs catégorie renseignés (label → valeur).
    const extra = fields
      .map((f) => ({ label: f.label, value: answers[f.key]?.trim() ?? "" }))
      .filter((e) => e.value);
    // Nombre d'invités déduit d'un éventuel champ catégorie « invités ».
    const guests = answers.invites?.trim() || "";

    const details = [
      eventType && `Type d'événement : ${eventType}`,
      date && `Date : ${date}`,
      location.trim() && `Lieu : ${location.trim()}`,
      ...extra.map((e) => `${e.label} : ${e.value}`),
      phone.trim() && `Téléphone : ${phone.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    const body = details
      ? `${details}\n\n${message.trim()}`
      : message.trim();

    const demande = {
      event_need: eventType || null,
      event_date: date || null,
      event_location: location.trim() || null,
      guests_count: guests || null,
      client_email: email.trim() || null,
      client_phone: phone.trim() || null,
      client_address: address.trim() || null,
      extra,
      // Prestations dictées par le client (une par ligne) → le prestataire
      // n'ajoute que le prix. Repli sur la dérivation catégorie si vide.
      items: wantedItems.length
        ? wantedItems
        : demandeItems(vendor.category, answers),
    };

    // Nom de la famille — dénormalisé sur la conversation car le prestataire
    // ne peut pas lire le profil du particulier (RLS).
    const { data: me } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();
    const clientName =
      (me as { full_name: string | null } | null)?.full_name?.trim() || null;

    const { data: conv, error: cErr } = await supabase
      .from("conversations")
      .insert({
        particulier_id: userId,
        prestataire_id: vendor.userId,
        vendor_id: vendor.id,
        vendor_name: vendor.name,
        particulier_name: clientName,
        demande,
        subject: `Demande de devis — ${vendor.name}`,
      })
      .select("id")
      .single();
    if (cErr || !conv) {
      setSending(false);
      setError(cErr?.message ?? "Impossible de démarrer la conversation.");
      return;
    }

    const { error: mErr } = await supabase
      .from("messages")
      .insert({ conversation_id: conv.id, sender_id: userId, body });
    if (mErr) {
      setSending(false);
      setError(mErr.message);
      return;
    }

    onDone();
    router.push(`/dashboard/messages/${conv.id}`);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-plum">
            Type d&apos;événement
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className={`mt-1.5 ${inputCls}`}
          >
            <option value="">Choisir…</option>
            <option>Mariage</option>
            <option>Anniversaire</option>
            <option>Baptême</option>
            <option>Gala / soirée</option>
            <option>Autre</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-plum">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`mt-1.5 ${inputCls}`}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-plum">Lieu</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="ex. Paris 11e, salle des fêtes…"
            className={`mt-1.5 ${inputCls}`}
          />
        </div>
      </div>
      {fields.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div
              key={f.key}
              className={fields.length === 1 ? "sm:col-span-2" : ""}
            >
              <label className="text-sm font-medium text-plum">{f.label}</label>
              <input
                type={f.type ?? "text"}
                {...(f.type === "number" ? { min: 1 } : {})}
                value={answers[f.key] ?? ""}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [f.key]: e.target.value }))
                }
                placeholder={f.placeholder}
                className={`mt-1.5 ${inputCls}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Ce que le client veut exactement → devient les lignes du devis. */}
      <div>
        <label className="text-sm font-medium text-plum">
          Prestations souhaitées
        </label>
        <textarea
          rows={3}
          value={wanted}
          onChange={(e) => setWanted(e.target.value)}
          className={`mt-1.5 ${inputCls}`}
          placeholder={"Une prestation par ligne, ex. :\nMaquillage mariée\nMaquillage 2 demoiselles d'honneur\nEssai maquillage"}
        />
        <p className="mt-1 text-xs text-slate">
          Listez précisément ce que vous voulez. Le prestataire fixera le prix
          de chaque ligne.
        </p>
      </div>

      {/* Coordonnées — permettent au prestataire d'établir le devis. */}
      <div>
        <p className="text-sm font-semibold text-plum">Vos coordonnées</p>
        <div className="mt-2 grid gap-4 sm:grid-cols-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            className={inputCls}
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone"
            className={inputCls}
          />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Adresse (facultatif)"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-plum">Message</label>
        <textarea
          required
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`mt-1.5 ${inputCls}`}
          placeholder="Décrivez votre projet, vos attentes, votre budget…"
        />
      </div>
      {error && <p className="text-sm text-festif">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
      >
        <Send size={17} />
        {sending ? "Envoi…" : "Envoyer la demande"}
      </button>
    </form>
  );
}

function EventPicker({
  events,
  onConfirm,
  error,
}: {
  events: { id: string; name: string }[];
  onConfirm: (id: string, name: string) => void | Promise<void>;
  error?: string;
}) {
  const [choice, setChoice] = useState(events[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const selected = events.find((e) => e.id === choice) ?? events[0];
  return (
    <div>
      <p className="text-sm text-slate">
        À quel événement voulez-vous rattacher ce prestataire ?
      </p>
      <div className="mt-4 space-y-2">
        {events.map((ev) => (
          <label
            key={ev.id}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
              choice === ev.id
                ? "border-violet bg-violet-soft text-violet"
                : "border-black/10 text-plum hover:border-violet/40"
            }`}
          >
            <input
              type="radio"
              name="event"
              checked={choice === ev.id}
              onChange={() => setChoice(ev.id)}
              className="accent-violet"
            />
            {ev.name}
          </label>
        ))}
      </div>
      {error && <p className="mt-3 text-sm text-festif">{error}</p>}
      <button
        type="button"
        disabled={busy || !selected}
        onClick={async () => {
          if (!selected) return;
          setBusy(true);
          await onConfirm(selected.id, selected.name);
          setBusy(false);
        }}
        className="mt-5 w-full rounded-2xl bg-violet px-6 py-3.5 text-base font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
      >
        {busy ? "Ajout…" : "Ajouter à cet événement"}
      </button>
    </div>
  );
}
