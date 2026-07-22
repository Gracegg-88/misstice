"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-xl border border-black/10 bg-cream px-4 py-1.5 text-sm text-plum outline-none focus:border-violet";
const codeInputCls =
  "w-full rounded-xl border border-black/10 bg-cream px-4 py-2.5 text-center text-lg tracking-[0.5em] text-plum outline-none focus:border-violet";

// Numéro nettoyé pour Supabase Auth (format international attendu, ex. +33612345678).
const toE164 = (raw: string) => raw.trim().replace(/[\s().-]/g, "");

/**
 * Vérification téléphone par OTP SMS (numéro puis code) — réutilisée dans
 * le stepper d'inscription (app/creer) et dans app/verifier-telephone
 * (filet pour les comptes créés via Google, qui ne passent pas par le
 * stepper et n'ont donc jamais vérifié leur numéro).
 */
export default function PhoneVerification({
  onVerified,
}: {
  onVerified: () => void;
}) {
  const [phase, setPhase] = useState<"number" | "code">("number");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendCode = async () => {
    const trimmed = toE164(phone);
    if (!trimmed || sending) return;
    setError("");
    setSending(true);
    const supabase = createClient();
    // Rattache et vérifie ce numéro pour le compte déjà authentifié (envoie
    // le SMS via le Send SMS Hook Supabase → Brevo).
    const { error: pErr } = await supabase.auth.updateUser({ phone: trimmed });
    setSending(false);
    if (pErr) {
      setError(pErr.message);
      return;
    }
    setPhase("code");
    setCooldown(30);
  };

  const verify = async () => {
    if (code.trim().length < 6 || verifying) return;
    setError("");
    setVerifying(true);
    const supabase = createClient();
    const { error: vErr } = await supabase.auth.verifyOtp({
      phone: toE164(phone),
      token: code.trim(),
      type: "phone_change",
    });
    if (vErr) {
      setVerifying(false);
      setError(
        /expired|invalid/i.test(vErr.message)
          ? "Code invalide ou expiré. Vérifiez le code ou demandez-en un nouveau."
          : vErr.message
      );
      return;
    }
    // Miroir dans profiles (numéro + statut vérifié) pour affichage et pour
    // le filet de /pro/layout.tsx.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ phone: toE164(phone), phone_verified_at: new Date().toISOString() })
        .eq("id", user.id);
    }
    setVerifying(false);
    onVerified();
  };

  const resend = async () => {
    if (cooldown > 0) return;
    setError("");
    const supabase = createClient();
    const { error: rErr } = await supabase.auth.resend({
      type: "phone_change",
      phone: toE164(phone),
    });
    if (rErr) {
      setError(rErr.message);
      return;
    }
    setCooldown(30);
  };

  return (
    <div>
      {phase === "number" ? (
        <>
          <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
            Vérifiez votre téléphone
          </h1>
          <p className="mt-1 text-sm text-slate">
            Un code à 6 chiffres par SMS confirmera votre numéro.
          </p>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className={`mt-4 ${inputCls}`}
          />
          <button
            onClick={sendCode}
            disabled={sending || !toE164(phone)}
            className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
          >
            {sending ? "Envoi…" : "Recevoir le code"}
          </button>
        </>
      ) : (
        <>
          <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
            Entrez le code reçu
          </h1>
          <p className="mt-1 text-sm text-slate">
            Code envoyé au <span className="font-semibold text-plum">{phone}</span>.
          </p>
          <input
            inputMode="numeric"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className={`mt-4 ${codeInputCls}`}
          />
          <button
            onClick={verify}
            disabled={verifying || code.trim().length < 6}
            className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
          >
            {verifying ? "Vérification…" : "Vérifier le code"}
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="mt-2 w-full text-center text-sm font-medium text-violet hover:text-violet-dark disabled:text-slate"
          >
            {cooldown > 0 ? `Renvoyer le code (${cooldown}s)` : "Renvoyer le code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("number");
              setCode("");
              setError("");
            }}
            className="mt-3 block w-full text-center text-xs text-slate hover:text-plum"
          >
            Modifier le numéro
          </button>
        </>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
          {error}
        </p>
      )}
    </div>
  );
}
