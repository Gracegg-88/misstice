"use client";

import { useState } from "react";
import { Check, X, PartyPopper, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Invitation = {
  event_id: string;
  name: string;
  event_date: string | null;
  event_type: string | null;
  host_name: string | null;
  invitation_card_url: string | null;
};

function formatDate(d: string | null): string | null {
  if (!d) return null;
  const date = new Date(d + "T00:00:00");
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PublicInvitationClient({
  token,
  invitation,
}: {
  token: string;
  invitation: Invitation;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [plusOne, setPlusOne] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<null | "confirmé" | "décliné">(null);

  const dateLabel = formatDate(invitation.event_date);

  const respond = async (status: "confirmé" | "décliné") => {
    if (!name.trim()) {
      setError("Merci d'indiquer votre nom.");
      return;
    }
    setSending(true);
    setError("");
    const supabase = createClient();
    const { data, error: rpcErr } = await supabase.rpc("rsvp_public", {
      p_token: token,
      p_name: name.trim(),
      p_email: email.trim() || null,
      p_status: status,
      p_plus_one: plusOne,
    });
    setSending(false);
    if (rpcErr || data === false) {
      setError("Une erreur est survenue. Réessayez.");
      return;
    }
    setDone(status);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-cream px-5 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xl">
        {/* En-tête / carte d'invitation */}
        {invitation.invitation_card_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={invitation.invitation_card_url}
            alt="Invitation"
            className="w-full object-cover"
          />
        ) : (
          <div className="bg-violet px-6 py-8 text-center text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              {invitation.event_type || "Invitation"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">
              {invitation.name}
            </h1>
            {invitation.host_name && (
              <p className="mt-2 text-sm text-white/85">
                à l&apos;invitation de {invitation.host_name}
              </p>
            )}
          </div>
        )}

        <div className="p-6">
          {invitation.invitation_card_url && (
            <div className="mb-4 text-center">
              <h1 className="font-display text-2xl font-semibold text-plum">
                {invitation.name}
              </h1>
              {invitation.host_name && (
                <p className="mt-1 text-sm text-slate">
                  à l&apos;invitation de {invitation.host_name}
                </p>
              )}
            </div>
          )}

          {dateLabel && (
            <p className="mb-5 text-center text-sm font-medium capitalize text-violet">
              {dateLabel}
            </p>
          )}

          {done ? (
            <div className="py-6 text-center">
              <div
                className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                  done === "confirmé"
                    ? "bg-emerald-soft text-emerald"
                    : "bg-cream text-slate"
                }`}
              >
                {done === "confirmé" ? (
                  <PartyPopper size={26} />
                ) : (
                  <Check size={26} />
                )}
              </div>
              <p className="mt-4 font-display text-lg font-semibold text-plum">
                {done === "confirmé"
                  ? "Merci, votre présence est confirmée !"
                  : "Réponse enregistrée"}
              </p>
              <p className="mt-1 text-sm text-slate">
                {done === "confirmé"
                  ? "Nous avons hâte de vous y retrouver."
                  : "Merci de nous avoir prévenus."}
              </p>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-slate">
                Merci de confirmer votre présence.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom et prénom"
                  className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre e-mail (facultatif)"
                  className="w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-sm text-plum outline-none focus:border-violet"
                />
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate">
                  <input
                    type="checkbox"
                    checked={plusOne}
                    onChange={(e) => setPlusOne(e.target.checked)}
                    className="h-4 w-4 accent-violet"
                  />
                  Je viens accompagné(e)
                </label>
              </div>

              {error && (
                <p className="mt-3 text-center text-sm text-festif">{error}</p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => respond("confirmé")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet py-3 text-sm font-semibold text-white hover:bg-violet-dark disabled:opacity-60"
                >
                  {sending ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <Check size={17} />
                  )}
                  Je serai présent(e)
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => respond("décliné")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 py-3 text-sm font-semibold text-plum hover:bg-cream disabled:opacity-60"
                >
                  <X size={17} />
                  Je ne pourrai pas
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-slate">
        Propulsé par{" "}
        <a href="/" className="font-semibold text-violet">
          Misstice
        </a>
      </p>
    </div>
  );
}
