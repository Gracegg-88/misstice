import { BadgeCheck, Clock, Lock, ExternalLink } from "lucide-react";

export default function StripeConnectStatus({
  status,
}: {
  status: "non_demarre" | "en_attente" | "actif";
}) {
  return (
    <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-plum">
        <Lock size={20} className="text-violet" />
        Paiement et informations bancaires
      </h2>

      {status === "non_demarre" && (
        <>
          <p className="mt-1 text-sm text-slate">
            Dernière étape avant d&apos;être visible auprès des familles :
            vérifiez votre identité et vos informations bancaires via Stripe,
            notre partenaire de paiement sécurisé. Ça prend quelques minutes,
            et c&apos;est ce qui vous permet d&apos;être payé automatiquement
            après chaque événement.
          </p>
          <a
            href="/api/stripe/connect/onboard"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            Configurer mes informations de paiement
          </a>
        </>
      )}

      {status === "en_attente" && (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-festif-soft px-4 py-3 text-sm text-festif">
            <Clock size={18} />
            <span>Votre dossier est en cours de vérification par Stripe.</span>
          </div>
          <p className="mt-3 text-sm text-slate">
            Si vous n&apos;avez pas terminé le formulaire, reprenez-le où
            vous vous étiez arrêté·e.
          </p>
          <a
            href="/api/stripe/connect/onboard"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-dark"
          >
            Reprendre l&apos;inscription
          </a>
        </>
      )}

      {status === "actif" && (
        <>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-soft px-4 py-3 text-sm text-emerald">
            <BadgeCheck size={18} />
            <span>Informations de paiement actives. Vous pouvez recevoir des paiements.</span>
          </div>
          <a
            href="/api/stripe/connect/dashboard-link"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-black/10 px-5 py-2.5 text-sm font-semibold text-plum transition-colors hover:border-violet/40"
          >
            Gérer mes informations bancaires
            <ExternalLink size={15} />
          </a>
        </>
      )}
    </div>
  );
}
