import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
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
import GuideProductPreview from "@/components/guide/GuideProductPreview";

export const metadata: Metadata = {
  title:
    "Comment organiser un mariage en 2026 : budget, étapes et checklist complète",
  description:
    "Guide complet pour organiser votre mariage, petit budget ou grand jour : checklist mois par mois, budget moyen par poste, et comment trouver des prestataires vérifiés sans passer par un wedding planner.",
  alternates: { canonical: "/organiser-un-mariage" },
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
  "Contactez directement les prestataires plutôt que de passer par un intermédiaire (type wedding planner, souvent facturé entre 2 000 et 5 000 euros rien que pour la coordination) qui prend une commission sur chaque poste.",
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
      subtitle="Checklist mois par mois, budget moyen par poste, et comment trouver des prestataires vérifiés sans passer par un wedding planner."
      toc={toc}
    >
      <Reveal>
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Organiser un mariage en 2026 peut vite devenir un tourbillon de
          décisions, de budgets à équilibrer et de prestataires à choisir.
          Pourtant, avec une bonne vision d&apos;ensemble et les bons
          outils, cette aventure peut rester douce, fluide et pleine
          d&apos;excitation.
        </p>
      </Reveal>

      <GuideSection
        id="budget"
        title="Combien coûte un mariage en France en 2026"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Le budget moyen d&apos;un mariage en France s&apos;élève à
          19 293 € pour environ 90 invités, soit 215 € par convive, selon
          le Rapport 2026 sur le Secteur Nuptial de Mariages.net, réalisé
          auprès de 1 304 couples mariés en 2025. Voici une répartition
          indicative par poste, à ajuster selon vos priorités.
        </p>
        <div className="mt-5">
          <GuideBudgetTable rows={budgetRows} />
        </div>
        <p className="mt-2.5 text-xs text-slate/80">
          Source :{" "}
          <a
            href="https://www.mariages.net/articles/quel-budget-pour-mon-mariage--c6243"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-violet"
          >
            Rapport 2026 sur le Secteur Nuptial, Mariages.net
          </a>
        </p>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          Ces chiffres restent indicatifs. Le poste le plus flexible reste
          souvent le nombre d&apos;invités : réduire de 100 à 50 convives
          peut diviser votre budget global par deux sans réduire la qualité
          de la journée.
        </p>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          Ces chiffres peuvent sembler abstraits au premier regard, et
          c&apos;est normal, personne ne planifie un budget mariage tous
          les jours. L&apos;essentiel n&apos;est pas de tout connaître
          d&apos;avance, mais de savoir où concentrer votre attention en
          premier : le lieu et le traiteur, puisque ce sont eux qui
          déterminent la majorité des autres postes.
        </p>
      </GuideSection>

      <GuideSection id="checklist" title="La checklist mariage, mois par mois">
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Planifier un mariage implique de gérer de nombreuses étapes,
          coordonner les prestataires et prendre les bonnes décisions au bon
          moment, parfois sous la pression des attentes familiales. Une
          checklist claire, mois par mois, permet d&apos;avancer sereinement
          et d&apos;éviter les oublis de dernière minute.
        </p>
        <div className="mt-5">
          <GuideChecklist periods={checklist} />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          Une checklist, même complète, ne suffit pas toujours à gérer la
          réalité d&apos;un mariage. C&apos;est là que Misstice devient
          utile : la plateforme ne se contente pas de lister les étapes,
          elle centralise vos informations, suit votre budget en temps
          réel, et vous aide à coordonner vos prestataires sans avoir à
          jongler entre dix outils différents.
        </p>
        <GuideProductPreview mode="budget" />
        <div className="mt-6">
          <GuideCta href="/creer" label="Créer mon événement gratuitement" accent />
        </div>
      </GuideSection>

      <GuideSection
        id="petit-budget"
        title="Organiser un mariage avec un petit budget ou en comité restreint"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Un mariage en comité restreint ou avec un budget serré demande de
          faire des choix réfléchis et de savoir où concentrer ses efforts,
          sans pour autant sacrifier l&apos;émotion du jour J.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate sm:text-base">
          Voici comment réduire les coûts sans réduire l&apos;émotion.
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
          Un mariage intime ou à petit budget n&apos;a rien d&apos;un
          compromis. C&apos;est souvent l&apos;occasion de faire des choix
          plus personnels, et de garder une vision claire de chaque poste
          de dépense du début à la fin.
        </p>
        <div className="mt-6">
          <GuideCta href="/prestataires" label="Trouvez vos prestataires de mariage" />
        </div>
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
            href="/faq"
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
