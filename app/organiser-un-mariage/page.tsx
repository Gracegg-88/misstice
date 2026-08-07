import type { Metadata } from "next";
import Link from "next/link";
import GuideLayout from "@/components/guide/GuideLayout";
import GuideSection from "@/components/guide/GuideSection";
import GuideBudgetTable, {
  type BudgetRow,
} from "@/components/guide/GuideBudgetTable";
import GuideChecklist, {
  type ChecklistPeriod,
} from "@/components/guide/GuideChecklist";
import GuideFaq, { type FaqItem } from "@/components/guide/GuideFaq";
import GuideCta from "@/components/guide/GuideCta";
import ScreenshotDashboard from "@/components/guide/ScreenshotDashboard";

export const metadata: Metadata = {
  title:
    "Comment organiser un mariage en 2026 : budget, étapes et checklist complète",
  description:
    "Guide complet pour organiser votre mariage, petit budget ou grand jour : checklist mois par mois, budget moyen par poste, et comment trouver des prestataires vérifiés sans passer par un wedding planner.",
};

const toc = [
  { id: "budget", label: "Budget moyen" },
  { id: "checklist", label: "Checklist mois par mois" },
  { id: "petit-budget", label: "Petit budget et comité restreint" },
  { id: "prestataires", label: "Trouver vos prestataires" },
  { id: "faq", label: "FAQ" },
];

const budgetRows: BudgetRow[] = [
  { poste: "Salle de réception", paris: "3 000 à 8 000 €", province: "1 500 à 4 000 €" },
  { poste: "Traiteur (par personne)", paris: "80 à 150 €", province: "50 à 100 €" },
  { poste: "Photographe", paris: "1 500 à 3 000 €", province: "1 000 à 2 000 €" },
  { poste: "DJ / animation", paris: "800 à 1 500 €", province: "600 à 1 200 €" },
  { poste: "Fleuriste et décoration", paris: "1 000 à 2 500 €", province: "700 à 1 800 €" },
  { poste: "Robe et costume", paris: "1 000 à 3 000 €", province: "800 à 2 500 €" },
];

const checklist: ChecklistPeriod[] = [
  {
    periode: "12 mois avant",
    items: [
      "Fixez une date et réservez le lieu. C'est la première contrainte qui détermine tout le reste, la disponibilité des salles se joue souvent un an à l'avance sur les mois de mai à septembre.",
      "Définissez un budget global réaliste avant de commencer à chercher des prestataires, pas après.",
    ],
  },
  {
    periode: "8 à 10 mois avant",
    items: [
      "Réservez traiteur et photographe, deux des prestataires les plus demandés et les premiers à afficher complet sur les dates populaires.",
      "Établissez une première liste d'invités, même approximative, elle conditionne le choix de la salle et du traiteur.",
    ],
  },
  {
    periode: "6 mois avant",
    items: [
      "Choisissez la robe, le costume, et lancez les essayages.",
      "Réservez DJ, fleuriste et décorateur.",
    ],
  },
  {
    periode: "3 mois avant",
    items: [
      "Envoyez les faire-part définitifs.",
      "Finalisez le menu avec le traiteur et confirmez les détails avec chaque prestataire.",
    ],
  },
  {
    periode: "1 mois avant",
    items: [
      "Confirmez le nombre définitif d'invités auprès du traiteur.",
      "Préparez le plan de table.",
    ],
  },
  {
    periode: "Semaine du mariage",
    items: [
      "Confirmez les horaires avec tous les prestataires.",
      "Préparez une checklist du jour J à confier à un témoin, pour ne rien gérer vous-même le jour venu.",
    ],
  },
];

const petitBudgetTips = [
  "Choisissez une date hors saison (novembre à mars) ou un jour de semaine, cela peut réduire le coût de la salle et du traiteur de 20 à 30 pour cent.",
  "Privilégiez un lieu qui n'impose pas son propre traiteur, vous gagnez en liberté de négociation.",
  "Contactez directement les prestataires plutôt que de passer par un intermédiaire qui prend une commission sur chaque poste.",
];

const faqItems: FaqItem[] = [
  {
    q: "Faut-il obligatoirement un wedding planner pour organiser son mariage ?",
    a: "Non. Un wedding planner facilite la coordination mais n'est pas indispensable, surtout pour un mariage en comité restreint. Des outils comme Misstice remplacent une grande partie de ce rôle de coordination.",
  },
  {
    q: "Combien de temps à l'avance faut-il commencer à organiser son mariage ?",
    a: "Idéalement entre 8 et 12 mois avant la date, pour sécuriser les prestataires les plus demandés.",
  },
  {
    q: "Comment réduire le budget d'un mariage sans le sacrifier ?",
    a: "En ajustant en priorité le nombre d'invités et la saison, deux leviers qui influencent tous les autres postes de dépense.",
  },
];

export default function OrganiserUnMariagePage() {
  return (
    <GuideLayout
      heroImage="/wedding-crowd.jpg"
      heroAlt="Invités souriants célébrant un mariage"
      title="Comment organiser un mariage en 2026"
      toc={toc}
    >
      <GuideSection
        id="budget"
        title="Combien coûte un mariage en France en 2026"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Le budget moyen d&apos;un mariage en France se situe entre 12 000
          et 18 000 euros pour environ 80 invités, avec de fortes variations
          selon la région et le nombre de convives. Voici une répartition
          indicative par poste, à ajuster selon vos priorités.
        </p>
        <div className="mt-5">
          <GuideBudgetTable rows={budgetRows} />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          Ces chiffres restent indicatifs. Le poste le plus flexible reste
          souvent le nombre d&apos;invités : réduire de 100 à 50 convives
          peut diviser votre budget global par deux sans réduire la qualité
          de la journée.
        </p>
      </GuideSection>

      <GuideSection id="checklist" title="La checklist mariage, mois par mois">
        <GuideChecklist periods={checklist} />
        <div className="mt-6">
          <ScreenshotDashboard type="checklist" />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          Sur Misstice, cette checklist se construit automatiquement dès la
          création de votre événement, avec des rappels et un suivi partagé
          entre tous ceux qui organisent avec vous.
        </p>
        <div className="mt-6">
          <GuideCta href="/creer" label="Créer mon événement gratuitement" />
        </div>
      </GuideSection>

      <GuideSection
        id="petit-budget"
        title="Organiser un mariage avec un petit budget ou en comité restreint"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          C&apos;est là que beaucoup de couples abandonnent l&apos;idée
          d&apos;un wedding planner, souvent facturé entre 2 000 et 5 000
          euros rien que pour la coordination. Un mariage en petit comité,
          entre 20 et 40 invités, ou un budget serré ne veut pas dire
          renoncer à un beau mariage. Voici comment réduire les coûts sans
          réduire l&apos;émotion.
        </p>
        <ul className="mt-4 space-y-2.5">
          {petitBudgetTips.map((tip, i) => (
            <li
              key={i}
              className="flex gap-2.5 text-sm leading-relaxed text-slate sm:text-base"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          C&apos;est exactement ce que permet Misstice. Contrairement à un
          wedding planner qui facture son temps, vous gardez la main sur
          l&apos;organisation tout en accédant aux mêmes outils
          professionnels : budget centralisé, checklist, gestion des
          invités, et des prestataires vérifiés que vous contactez
          vous-même, sans frais de coordination.
        </p>
      </GuideSection>

      <GuideSection id="prestataires" title="Trouver vos prestataires de mariage">
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Photographe, traiteur, DJ, décorateur, salle de réception : chaque
          prestataire compte sur Misstice avant même de recevoir votre
          premier message.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate sm:text-base">
          <Link
            href="/confiance"
            className="font-semibold text-violet hover:text-violet-dark"
          >
            Découvrez comment chaque prestataire est vérifié
          </Link>
        </p>
        <div className="mt-6">
          <GuideCta
            href="/prestataires"
            label="Voir les prestataires disponibles"
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate sm:text-base">
          Vous êtes photographe, traiteur, DJ ou lieu de réception ?{" "}
          <Link
            href="/devenir-prestataire"
            className="font-semibold text-violet hover:text-violet-dark"
          >
            Rejoignez les prestataires vérifiés de Misstice
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection
        id="faq"
        title="Questions fréquentes sur l'organisation d'un mariage"
      >
        <GuideFaq items={faqItems} />
        <p className="mt-5 text-sm leading-relaxed text-slate">
          Pour les questions générales sur la plateforme, consultez notre{" "}
          <Link
            href="/#faq"
            className="font-semibold text-violet hover:text-violet-dark"
          >
            foire aux questions
          </Link>
          .
        </p>
      </GuideSection>
    </GuideLayout>
  );
}
