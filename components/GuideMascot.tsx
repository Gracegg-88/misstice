"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

// Bulle d'aide contextuelle simple : texte statique pré-écrit selon la page,
// PAS un chatbot IA — juste un petit personnage repris de l'étincelle du
// logo Misstice (app/icon.svg), pour rester cohérent avec l'identité déjà
// en place plutôt que d'inventer un nouveau mascotte du jour au lendemain.
const TIPS: { match: (path: string) => boolean; text: string }[] = [
  {
    match: (p) => p.startsWith("/creer"),
    text: "Créez votre compte en quelques secondes : un code à 6 chiffres vous sera envoyé par email pour confirmer votre adresse.",
  },
  {
    match: (p) => p.startsWith("/auth"),
    text: "Un souci pour vous connecter ? Cliquez sur « Mot de passe oublié » — le lien reçu par email vous permettra d'en choisir un nouveau.",
  },
  {
    match: (p) => p.startsWith("/pro/devis"),
    text: "Plus votre devis est précis (date, lieu, prestations, prix), plus vite votre client pourra l'accepter.",
  },
  {
    match: (p) => p.startsWith("/pro/profil"),
    text: "Ajoutez votre numéro SIRET pour obtenir le badge « Vérifié » et rassurer vos futurs clients.",
  },
  {
    match: (p) => p.startsWith("/pro"),
    text: "Bienvenue dans votre espace prestataire : suivez vos demandes, envoyez des devis et gérez votre fiche publique.",
  },
  {
    match: (p) => p.startsWith("/dashboard/budget"),
    text: "Votre budget se met à jour automatiquement dès qu'un devis est accepté.",
  },
  {
    match: (p) => p.startsWith("/dashboard"),
    text: "Votre espace personnel : suivez votre budget, votre checklist et vos invités pour chaque événement.",
  },
  {
    match: (p) => p.startsWith("/prestataires"),
    text: "Utilisez les filtres pour trouver le prestataire idéal, puis demandez-lui un devis gratuit et sans engagement.",
  },
];
const DEFAULT_TIP =
  "Besoin d'aide ? Explorez le menu ou contactez-nous si quelque chose n'est pas clair.";

export default function GuideMascot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const tip = TIPS.find((t) => t.match(pathname))?.text ?? DEFAULT_TIP;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="ev-fade-in relative max-w-xs rounded-2xl border border-black/5 bg-white p-4 pr-8 text-sm text-plum shadow-xl">
          <button
            type="button"
            aria-label="Fermer l'aide"
            onClick={() => setOpen(false)}
            className="absolute right-2 top-2 text-slate hover:text-plum"
          >
            <X size={16} />
          </button>
          {tip}
        </div>
      )}
      <button
        type="button"
        aria-label={open ? "Fermer l'aide" : "Afficher une astuce"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-violet shadow-lg shadow-violet/30 transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
          <path
            d="M32 3 Q32 32 61 32 Q32 32 32 61 Q32 32 3 32 Q32 32 32 3 Z"
            fill="#FF8C42"
          />
          <circle cx="26" cy="30" r="2.6" fill="#1A1A2E" />
          <circle cx="38" cy="30" r="2.6" fill="#1A1A2E" />
          <path
            d="M25 37 Q32 42 39 37"
            stroke="#1A1A2E"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>
    </div>
  );
}
