"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PartyPopper,
  CalendarDays,
  Clock,
  MapPin,
  Check,
  X,
  Pencil,
  CheckCircle2,
} from "lucide-react";
import Logo from "@/components/Logo";

type Info = {
  guest_name: string;
  event_name: string;
  status: string;
  event_date: string | null;
  event_time: string | null;
  location: string | null;
  dress_code: string | null;
  plus_one: boolean;
  invitation_card_url: string | null;
};

export default function RsvpPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [state, setState] = useState<"loading" | "ready" | "invalid">("loading");
  const [info, setInfo] = useState<Info | null>(null);
  const [answer, setAnswer] = useState<"confirmé" | "décliné" | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [respondError, setRespondError] = useState("");
  // Réponse pré-sélectionnée depuis l'email (?r=…), à CONFIRMER par un clic.
  // On ne soumet JAMAIS automatiquement (les scanners de liens préchargent l'URL).
  const [preselect, setPreselect] = useState<"confirmé" | "décliné" | null>(null);
  // Jeton du lien (?t=…) — requis pour répondre (anti-IDOR).
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("guest_rsvp_info", { p_guest_id: id });
      const row = (Array.isArray(data) ? data[0] : data) as Info | undefined;
      if (!row) {
        setState("invalid");
        return;
      }
      setInfo(row);
      if (row.status === "confirmé" || row.status === "décliné") {
        setAnswer(row.status);
      }
      setState("ready");

      const params = new URLSearchParams(window.location.search);
      setToken(params.get("t"));

      // Choix venu de l'email (bouton Accepter / Décliner → ?r=…) : on PRÉ-SÉLECTIONNE
      // seulement. Aucune mutation au chargement (anti-préchargement des scanners).
      const r = params.get("r");
      if (
        (r === "confirmé" || r === "décliné") &&
        row.status !== "confirmé" &&
        row.status !== "décliné"
      ) {
        setPreselect(r);
      }
    })();
  }, [id]);

  const respond = async (status: "confirmé" | "décliné") => {
    if (!token) {
      setRespondError(
        "Lien incomplet. Ouvrez le lien reçu par email pour répondre."
      );
      return;
    }
    setBusy(true);
    setRespondError("");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("rsvp_guest", {
      p_guest_id: id,
      p_status: status,
      p_token: token,
    });
    setBusy(false);
    if (error || !data) {
      // Erreur transitoire : on garde l'invitation affichée, on prévient juste.
      setRespondError("Enregistrement impossible. Vérifiez votre connexion et réessayez.");
      return;
    }
    setAnswer(status);
    setJustSaved(true);
  };

  const fmtDate = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const confirmed = answer === "confirmé";
  const declined = answer === "décliné";

  type Card = { icon: typeof CalendarDays; label: string; value: string };
  const infoCards: Card[] = info
    ? [
        info.event_date && {
          icon: CalendarDays,
          label: "Date",
          value: fmtDate(info.event_date),
        },
        info.event_time && {
          icon: Clock,
          label: "Heure",
          value: info.event_time.replace(":", "h"),
        },
        info.location && { icon: MapPin, label: "Lieu", value: info.location },
      ].filter((c): c is Card => Boolean(c))
    : [];

  return (
    <div
      className="relative flex h-screen flex-col overflow-hidden bg-cream bg-cover bg-center"
      style={{ backgroundImage: "url('/background_login.png')" }}
    >
      <div className="absolute left-5 top-5 z-10 sm:left-8 sm:top-6">
        <a href="/" aria-label="Accueil">
          <Logo />
        </a>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-5 py-6">
        <div className="ev-fade-in w-full max-w-xs rounded-3xl border border-white/60 bg-white/85 p-4 text-center shadow-2xl backdrop-blur-md sm:p-5">
          {/* Icône */}
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-violet-soft ring-4 ring-violet-soft/40">
            <PartyPopper size={20} className="text-violet" />
          </div>

          {state === "loading" && (
            <p className="mt-6 text-sm text-slate">Chargement de l&apos;invitation…</p>
          )}

          {state === "invalid" && (
            <>
              <h1 className="mt-5 font-display text-2xl font-semibold text-plum">
                Lien invalide
              </h1>
              <p className="mt-2 text-sm text-slate">
                Cette invitation n&apos;existe plus.
              </p>
            </>
          )}

          {state === "ready" && info && (
            <>
              {/* Badge de statut */}
              {answer ? (
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-sm font-semibold ${
                    confirmed
                      ? "bg-emerald-soft text-emerald"
                      : "bg-festif-soft text-festif"
                  }`}
                >
                  {confirmed ? <Check size={15} /> : <X size={15} />}
                  {confirmed ? "Présence confirmée" : "Absence notée"}
                </span>
              ) : (
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-soft px-3.5 py-1 text-sm font-semibold text-violet">
                  <PartyPopper size={14} />
                  Vous êtes invité·e
                </span>
              )}

              {/* Titre */}
              <h1 className="mt-2 font-display text-xl font-semibold tracking-tight text-plum">
                {info.event_name}
              </h1>

              {/* Carte d'invitation téléversée (remplace le décor générique). */}
              {info.invitation_card_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={info.invitation_card_url}
                  alt="Invitation"
                  className="mt-3 w-full rounded-2xl border border-black/5"
                />
              ) : (
                <>
                  <div className="mx-auto mt-1 flex items-center justify-center gap-2 text-festif">
                    <span className="h-px w-6 bg-festif/40" />
                    <span className="text-sm">✦</span>
                    <span className="h-px w-6 bg-festif/40" />
                  </div>
                  <p className="mt-1 text-xs text-slate">
                    Une célébration chaleureuse préparée avec soin.
                  </p>
                </>
              )}

              {/* Message personnalisé */}
              <p className="mt-3 text-sm font-semibold text-plum">
                Bonjour {info.guest_name},
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate">
                {confirmed
                  ? "Votre présence est confirmée. Nous sommes ravis de vous compter parmi nous pour ce moment spécial."
                  : declined
                    ? "Vous avez décliné l'invitation. Vous nous manquerez — mais merci de nous avoir prévenus !"
                    : "Nous serions honorés de votre présence. Merci de nous indiquer si vous serez des nôtres."}
              </p>

              {/* Cartes infos (masquées si une carte visuelle est fournie) */}
              {!info.invitation_card_url && infoCards.length > 0 && (
                <div className="mt-3 space-y-2">
                  {infoCards.map((c) => (
                    <div
                      key={c.label}
                      className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/70 p-2.5 text-left"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-soft text-violet">
                        <c.icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate">
                          {c.label}
                        </p>
                        <p className="truncate text-sm font-semibold text-plum">
                          {c.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bandeau succès */}
              {answer && (
                <div
                  className={`mt-3 flex items-center justify-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold ${
                    confirmed
                      ? "bg-emerald-soft text-emerald"
                      : "bg-festif-soft text-festif"
                  }`}
                >
                  <CheckCircle2 size={18} />
                  {justSaved
                    ? "Merci, votre réponse a bien été enregistrée."
                    : confirmed
                      ? "Vous avez confirmé votre présence."
                      : "Vous avez décliné l'invitation."}
                </div>
              )}

              {/* Actions */}
              {answer ? (
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAnswer(null);
                      setJustSaved(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
                  >
                    <Pencil size={16} />
                    Modifier ma réponse
                  </button>
                </div>
              ) : (
                <>
                  {preselect && (
                    <p className="mt-3 text-xs font-medium text-violet">
                      Confirmez votre choix ci-dessous pour valider votre réponse.
                    </p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => respond("confirmé")}
                      disabled={busy}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-violet py-2 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60 ${
                        preselect === "confirmé" ? "ring-2 ring-violet ring-offset-2" : ""
                      }`}
                    >
                      <Check size={16} />
                      Je confirme
                    </button>
                    <button
                      type="button"
                      onClick={() => respond("décliné")}
                      disabled={busy}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/70 py-2 text-sm font-semibold text-plum hover:bg-white disabled:opacity-60 ${
                        preselect === "décliné" ? "ring-2 ring-festif ring-offset-2" : ""
                      }`}
                    >
                      <X size={16} />
                      Je décline
                    </button>
                  </div>
                </>
              )}

              {respondError && (
                <p className="mt-3 text-xs font-medium text-festif">
                  {respondError}
                </p>
              )}

              {/* Pied : tenue + accompagnant */}
              {(info.dress_code || info.plus_one) && (
                <p className="mt-3 border-t border-black/5 pt-2.5 text-xs text-slate">
                  {info.dress_code && <>Tenue : {info.dress_code}</>}
                  {info.dress_code && info.plus_one && " · "}
                  {info.plus_one && <>Accompagnant : 1 personne</>}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
