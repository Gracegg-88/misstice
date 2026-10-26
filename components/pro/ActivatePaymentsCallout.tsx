import { Lock, Clock } from "lucide-react";

/**
 * Encart affiché à la place de l'envoi de devis tant que les paiements
 * Stripe du prestataire ne sont pas actifs (payouts_enabled = false).
 * Le bouton réutilise le parcours d'onboarding Stripe existant
 * (/api/stripe/connect/onboard), qui reprend un dossier déjà commencé.
 */
export default function ActivatePaymentsCallout({
  status = "non_demarre",
  className = "",
}: {
  status?: "non_demarre" | "en_attente" | "actif";
  className?: string;
}) {
  const pending = status === "en_attente";
  return (
    <div className={`rounded-3xl border border-violet/20 bg-violet-soft/60 p-5 ${className}`}>
      <p className="flex items-center gap-2 font-display text-lg font-semibold text-plum">
        <Lock size={18} className="shrink-0 text-violet" aria-hidden="true" />
        Activez vos paiements (10 min) pour envoyer votre devis
      </p>
      <p className="mt-2 text-sm leading-relaxed text-slate">
        Vous pouvez déjà lire les demandes et répondre par message. Pour envoyer
        un devis, vérifiez votre identité et vos informations bancaires via
        Stripe, notre partenaire de paiement sécurisé : c&apos;est ce qui vous
        permet d&apos;être payé automatiquement après l&apos;événement.
      </p>
      {pending && (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate">
          <Clock size={16} className="shrink-0 text-violet" aria-hidden="true" />
          Votre dossier Stripe est commencé : reprenez-le où vous vous étiez arrêté·e.
        </p>
      )}
      <a
        href="/api/stripe/connect/onboard"
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
      >
        {pending ? "Reprendre l'activation" : "Activer mes paiements"}
      </a>
    </div>
  );
}
