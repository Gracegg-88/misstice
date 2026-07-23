"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";

/**
 * Écran affiché AVANT le vrai lien Supabase (voir le modèle d'email
 * "Reset Password" dans le dashboard Supabase, et app/api/admin/invite-admin
 * : le lien pointe ici avec `#confirm=<lien réel>` au lieu de mettre le lien
 * réel en clair). Certaines messageries (Outlook, filtres anti-spam)
 * scannent automatiquement TOUTES les URLs visibles dans un email dès sa
 * réception, sans intervention humaine — ce qui grille le code à usage
 * unique du lien de réinitialisation avant même l'ouverture du mail.
 * Un fragment d'URL (après le #) n'est jamais envoyé par le navigateur à
 * aucun serveur ; seul du JavaScript exécuté par un vrai clic peut le lire.
 * Un scanner qui se contente de récupérer cette page ne voit donc jamais le
 * lien réel — seul un clic humain sur le bouton ci-dessous le révèle et
 * l'utilise.
 */
export default function VerifyRedirectPage() {
  const [target, setTarget] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const marker = "confirm=";
    if (hash.startsWith(marker)) {
      setTarget(hash.slice(marker.length));
    } else {
      setMissing(true);
    }
  }, []);

  const go = () => {
    if (target) window.location.href = target;
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
            onClick={go}
            disabled={!target}
            className="mt-4 w-full rounded-xl bg-violet py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-dark disabled:opacity-50"
          >
            Continuer
          </button>
          {missing && (
            <p className="mt-4 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
              Lien incomplet ou invalide.{" "}
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
