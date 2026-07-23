"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/Header";
import { safeNext } from "@/lib/safe-next";

/**
 * Étape intermédiaire pour les liens envoyés par email (réinitialisation de
 * mot de passe, invitation admin) : certains clients mail/antivirus visitent
 * automatiquement les liens reçus pour les scanner, ce qui consomme le code
 * à usage unique avant même que la personne ne clique elle-même — le lien
 * paraît alors "invalide" au premier vrai clic. En n'échangeant le code que
 * sur une action explicite (clic du bouton), ces scanners automatiques
 * (qui ne cliquent pas de bouton) ne le consomment plus.
 */
export default function ConfirmPage() {
  const router = useRouter();
  const [code, setCode] = useState<string | null>(null);
  const [next, setNext] = useState("/dashboard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setCode(sp.get("code"));
    setNext(safeNext(sp.get("next"), "") || "/dashboard");
  }, []);

  const confirm = async () => {
    if (!code || loading) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
    setLoading(false);
    if (exErr) {
      setError(
        "Ce lien est invalide, a déjà été utilisé ou a expiré. Merci de redemander un nouveau lien."
      );
      return;
    }
    router.push(next);
    router.refresh();
  };

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
            disabled={!code || loading}
            className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
          >
            {loading ? "Vérification…" : "Continuer"}
          </button>
          {!code && (
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
