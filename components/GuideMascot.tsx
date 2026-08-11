"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
    text: "Un souci pour vous connecter ? Cliquez sur « Mot de passe oublié », le lien reçu par email vous permettra d'en choisir un nouveau.",
  },
  // Catégories nécessitant une rencontre/essai préalable (traiteur, robe &
  // tenue, coiffure & maquillage) : paiement immédiat à l'acceptation, mais
  // "officialisé" seulement après le clic "Confirmer après rencontre".
  {
    match: (p) => /^\/prestataires\/ville\/[^/]+\/traiteur$/.test(p),
    text: "🍽️ Bon à savoir : avant de confirmer, tu peux organiser une dégustation avec ton traiteur directement via la messagerie Misstice. Le paiement ne sera demandé qu'après votre rencontre, une fois que tu cliques sur \"Confirmer après rencontre\".",
  },
  {
    match: (p) => /^\/prestataires\/ville\/[^/]+\/robe-tenue$/.test(p),
    text: "👗 Bon à savoir : un essayage est souvent nécessaire avant de t'engager. Échange avec le prestataire via la messagerie Misstice pour organiser ça — le paiement se déclenche seulement après ta confirmation post-essayage.",
  },
  {
    match: (p) => /^\/prestataires\/ville\/[^/]+\/coiffure-maquillage$/.test(p),
    text: "💄 Bon à savoir : un essai coiffure-maquillage est recommandé avant le jour J. Organise-le via la messagerie Misstice — le paiement n'est demandé qu'une fois la rencontre confirmée.",
  },
  {
    match: (p) => /^\/prestataires\/ville\/[^/]+\/[^/]+$/.test(p),
    text: "✅ Bon à savoir : dès que tu acceptes un devis, le paiement sécurisé se déclenche automatiquement pour confirmer ta réservation.",
  },
  {
    match: (p) => p === "/devenir-prestataire",
    text: "💰 Bon à savoir : Misstice prend une petite commission sur chaque prestation réservée. Tes paiements sont sécurisés et versés automatiquement 48-72h après ton événement.",
  },
  {
    match: (p) => p.startsWith("/pro/devis"),
    text: "Plus votre devis est précis (date, lieu, prestations, prix), plus vite votre client pourra l'accepter.",
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

// Astuces d'accompagnement ponctuel (pas des rappels permanents) : affichées
// une seule fois par navigateur, comme un coup de pouce à un moment précis.
function hasSeen(id: string): boolean {
  try {
    return localStorage.getItem(`misstice_tip_${id}`) === "1";
  } catch {
    return false;
  }
}
function markSeen(id: string) {
  try {
    localStorage.setItem(`misstice_tip_${id}`, "1");
  } catch {
    // Stockage indisponible (navigation privée...) : tant pis, pas bloquant.
  }
}

export default function GuideMascot() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Astuces qui dépendent de l'état du compte (statut SIRET/Stripe) ou d'un
  // devis précis (statut de paiement) — chargées uniquement sur les pages
  // concernées, jamais ailleurs, pour ne pas multiplier les requêtes.
  const [dynamicTip, setDynamicTip] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDynamicTip(null);

    if (pathname === "/pro" || pathname.startsWith("/pro/profil")) {
      (async () => {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from("vendor_profiles")
          .select("siret_verified_at, stripe_onboarding_status")
          .eq("id", user.id)
          .maybeSingle();
        if (cancelled || !data) return;

        if (pathname === "/pro") {
          if (data.stripe_onboarding_status === "actif" && !hasSeen("pro-actif")) {
            markSeen("pro-actif");
            setDynamicTip(
              "👋 Ton profil est actif ! Tu peux gérer tes informations bancaires à tout moment depuis \"Gérer mes informations bancaires\"."
            );
          }
        } else if (!data.siret_verified_at) {
          setDynamicTip(
            "⏳ Ton profil est en cours de vérification. Une fois validé, il sera visible par les futurs mariés — tu peux suivre l'avancement ici."
          );
        } else if (data.stripe_onboarding_status !== "actif") {
          setDynamicTip(
            "🔒 Dernière étape avant d'être visible : vérifie ton identité et tes informations bancaires via Stripe, notre partenaire de paiement sécurisé. Ça prend quelques minutes."
          );
        } else if (!hasSeen("pro-profil-paiements")) {
          markSeen("pro-profil-paiements");
          setDynamicTip(
            "💸 Tes gains sont versés automatiquement après chaque événement confirmé. Retrouve le détail de chaque transaction ici."
          );
        }
      })();
    }

    if (pathname.startsWith("/devis/")) {
      const quoteId = pathname.split("/")[2];
      if (quoteId) {
        (async () => {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (!user || cancelled) return;
          const { data: quote } = await supabase
            .from("quotes")
            .select("prestataire_id, status, escrow_event_date")
            .eq("id", quoteId)
            .maybeSingle();
          // Uniquement côté famille : le prestataire consultant son propre
          // devis envoyé n'a pas à "accepter" ou "signaler" quoi que ce soit.
          if (cancelled || !quote || quote.prestataire_id === user.id) return;

          if (quote.status === "envoyé" || quote.status === "accepté") {
            setDynamicTip(
              "📋 En acceptant ce devis, le paiement sécurisé Misstice se déclenche pour confirmer ta réservation (sauf si une rencontre préalable est prévue avec ce prestataire)."
            );
          } else if (quote.status === "en attente de réalisation") {
            const eventPassed =
              !!quote.escrow_event_date &&
              new Date(quote.escrow_event_date) <= new Date();
            setDynamicTip(
              eventPassed
                ? "✅ Tout s'est bien passé ? Aucune action requise, le prestataire sera payé automatiquement sous peu. Un souci ? Signale-le ici avant la fin de la fenêtre de 72h après ton événement."
                : "⏱️ Ton paiement est en sécurité chez Misstice. Il sera versé au prestataire après ton événement, sauf signalement de ta part."
            );
          }
        })();
      }
    }

    if (
      (pathname.startsWith("/dashboard/messages/") ||
        pathname.startsWith("/pro/messagerie/")) &&
      !hasSeen("messagerie")
    ) {
      markSeen("messagerie");
      setDynamicTip(
        "💬 Pour ta sécurité, garde tous vos échanges ici sur Misstice — ça te permet de rester protégé·e par notre séquestre en cas de souci."
      );
    }

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const staticTip = TIPS.find((t) => t.match(pathname))?.text;
  const tip = dynamicTip ?? staticTip ?? DEFAULT_TIP;

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
        <svg viewBox="0 0 64 64" className="h-9 w-9" aria-hidden="true">
          {/* Chignon/pompon en étincelle, reprise du logo Misstice */}
          <path
            d="M32 2 Q32 12 42 12 Q32 12 32 22 Q32 12 22 12 Q32 12 32 2 Z"
            fill="#FF8C42"
          />
          {/* Visage rond façon emoji */}
          <circle cx="32" cy="38" r="20" fill="#FAFAF9" />
          <circle cx="25" cy="36" r="2.6" fill="#1A1A2E" />
          <circle cx="39" cy="36" r="2.6" fill="#1A1A2E" />
          <path
            d="M25 43 Q32 48 39 43"
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
