"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { EmailOtpType } from "@supabase/supabase-js";
import Header from "@/components/Header";
import { safeNext } from "@/lib/safe-next";

/**
 * Dernière étape après /auth/verify-redirect. Utilise `token_hash` +
 * verifyOtp plutôt que le code PKCE + exchangeCodeForSession : ce dernier
 * exige un "code verifier" posé dans le navigateur au moment de la demande,
 * introuvable si l'échange a lieu dans un nouvel onglet/fenêtre ou un autre
 * appareil — cause confirmée des échecs précédents. token_hash est
 * autonome, sans cette contrainte (voir doc Supabase Next.js officielle).
 */
export default function ConfirmPage() {
  const router = useRouter();
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [type, setType] = useState<EmailOtpType | null>(null);
  const [next, setNext] = useState("/dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setTokenHash(sp.get("token_hash"));
    setType(sp.get("type") as EmailOtpType | null);
    setNext(safeNext(sp.get("next"), "") || "/dashboard");
  }, []);

  useEffect(() => {
    if (tokenHash && type) confirm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenHash, type]);

  const confirm = async () => {
    if (!tokenHash || !type || loading) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    setLoading(false);
    if (verifyErr) {
      setError(
        `Ce lien est invalide, a déjà été utilisé ou a expiré. Merci de redemander un nouveau lien. (Détail technique : ${verifyErr.message})`
      );
      return;
    }
    router.push(next);
    router.refresh();
  };

  const ready = Boolean(tokenHash && type);

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-cream">
      <Header />
      <div className="flex flex-1 items-center justify-center px-5">
        <div className="ev-fade-in w-full max-w-sm rounded-3xl border border-black/5 bg-white/95 px-6 py-6 shadow-xl">
          <h1 className="font-display text-xl font-semibold tracking-tight text-plum">
            Confirmer la demande
          </h1>
          <p className="mt-2 text-sm text-slate">
            Pour votre sécurité, cliquez sur le bouton ci-dessous pour
            continuer.
          </p>
          <button
            onClick={confirm}
            disabled={!ready || loading}
            className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
          >
            {loading ? "Vérification…" : "Continuer"}
          </button>
          {!ready && (
            <p className="mt-4 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
              Lien incomplet ou invalide.{" "}
              <a href="/auth" className="font-semibold underline">
                Retour à la connexion
              </a>
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
              {error}{" "}
              <a href="/auth" className="font-semibold underline">
                Retour à la connexion
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
