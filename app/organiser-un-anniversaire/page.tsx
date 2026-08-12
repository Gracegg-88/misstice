import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import GuideLayout from "@/components/guide/GuideLayout";
import GuideSection from "@/components/guide/GuideSection";
import GuideSimpleTable, {
  type SimpleRow,
} from "@/components/guide/GuideSimpleTable";
import GuideChecklist, {
  type ChecklistPeriod,
} from "@/components/guide/GuideChecklist";
import GuideFaq, { type FaqItem } from "@/components/guide/GuideFaq";
import GuideCta from "@/components/guide/GuideCta";
import GuideProductPreview from "@/components/guide/GuideProductPreview";

export const metadata: Metadata = {
  title: "Comment organiser un anniversaire réussi : budget et checklist",
  description:
    "Guide complet pour organiser un anniversaire, entre amis ou en famille : budget moyen, checklist étape par étape, et comment trouver vos prestataires sans y passer des heures.",
  alternates: { canonical: "/organiser-un-anniversaire" },
  openGraph: {
    title: "Comment organiser un anniversaire réussi : budget et checklist",
    description: "Guide complet pour organiser un anniversaire : budget moyen, checklist étape par étape et prestataires vérifiés.",
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Organiser un anniversaire — Guide Misstice" },
};

const toc = [
  { id: "budget", label: "Budget moyen" },
  { id: "checklist", label: "Checklist" },
  { id: "petit-budget", label: "Petit budget" },
  { id: "prestataires", label: "Trouver vos prestataires" },
  { id: "faq", label: "FAQ" },
];

const budgetRows: SimpleRow[] = [
  { poste: "Location de salle", fourchette: "300 à 800 €" },
  { poste: "Traiteur ou buffet (par personne)", fourchette: "15 à 35 €" },
  { poste: "DJ ou animation musicale", fourchette: "300 à 700 €" },
  { poste: "Décoration", fourchette: "150 à 400 €" },
  { poste: "Gâteau et pâtisserie", fourchette: "80 à 250 €" },
  { poste: "Photographe", fourchette: "300 à 700 €" },
];

const checklist: ChecklistPeriod[] = [
  {
    periode: "6 à 8 semaines avant",
    items: [
      "Fixez la date et le lieu (domicile, salle, extérieur).",
      "Établissez la liste d'invités et envoyez les invitations.",
    ],
  },
  {
    periode: "3 à 4 semaines avant",
    items: [
      "Réservez le traiteur ou planifiez le menu si vous cuisinez vous-même.",
      "Commandez le gâteau.",
      "Réservez la décoration et l'animation musicale si besoin.",
    ],
  },
  {
    periode: "1 semaine avant",
    items: [
      "Confirmez le nombre définitif d'invités.",
      "Préparez la liste des courses et du matériel.",
    ],
  },
  {
    periode: "Jour J",
    items: [
      "Prévoyez une checklist d'installation (déco, tables, musique) pour ne rien oublier dans la précipitation.",
    ],
  },
];

const petitBudgetTips = [
  "Privilégiez un lieu gratuit ou peu coûteux (jardin, domicile, parc) plutôt qu'une salle louée.",
  "Optez pour un buffet participatif plutôt qu'un traiteur complet.",
  "Limitez la décoration à quelques éléments forts plutôt qu'une multitude de petits achats.",
];

const faqItems: FaqItem[] = [
  {
    q: "Combien de temps à l'avance organiser un anniversaire ?",
    a: "Comptez 6 à 8 semaines pour un anniversaire d'une trentaine de personnes, davantage si vous réservez un lieu très demandé.",
  },
  {
    q: "Faut-il un traiteur pour un anniversaire entre amis ?",
    a: "Non, un buffet participatif ou fait maison reste une option parfaitement adaptée pour un événement informel.",
  },
];

export default function OrganiserUnAnniversairePage() {
  return (
    <GuideLayout
      heroImage="/birthday-party.jpg"
      heroAlt="Amis célébrant un anniversaire autour d'un gâteau"
      title="Comment organiser un anniversaire"
      subtitle="Budget moyen, checklist étape par étape, et comment trouver vos prestataires sans y passer des heures."
      toc={toc}
      path="/organiser-un-anniversaire"
    >
      <Reveal>
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Organiser un anniversaire peut sembler simple sur le papier, et
          pourtant entre le lieu, le traiteur, la déco et la liste
          d&apos;invités, les détails s&apos;accumulent vite. Avec un peu de
          méthode, la fête reste ce qu&apos;elle doit être : un moment de
          plaisir, pas une source de stress.
        </p>
      </Reveal>

      <GuideSection id="budget" title="Combien coûte un anniversaire réussi">
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Pour une trentaine d&apos;invités, comptez entre 800 et 2 500
          euros selon le niveau de prestation choisi. Voici une répartition
          indicative.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate sm:text-base">
          Il n&apos;existe pas d&apos;étude officielle sur le budget moyen
          d&apos;un anniversaire en France. Les chiffres ci-dessous sont
          une estimation à titre indicatif, à ajuster selon vos choix et
          votre région.
        </p>
        <div className="mt-5">
          <GuideSimpleTable rows={budgetRows} />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          Un anniversaire à domicile ou dans un jardin réduit
          considérablement le premier poste de dépense, celui de la salle.
        </p>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          Ces chiffres restent une base de travail, pas une obligation.
          Beaucoup de belles fêtes se font avec la moitié de ce budget,
          simplement en priorisant deux ou trois postes plutôt que tous à
          la fois.
        </p>
      </GuideSection>

      <GuideSection id="checklist" title="La checklist anniversaire">
        <GuideChecklist periods={checklist} />
        <GuideProductPreview />
        <p className="mt-6 text-sm leading-relaxed text-slate sm:text-base">
          Une checklist papier suffit parfois, mais dès que plusieurs
          personnes s&apos;impliquent dans l&apos;organisation, les
          informations se perdent vite entre les messages et les appels.
          Misstice centralise tout au même endroit : budget, invités,
          tâches partagées, et prestataires vérifiés à contacter
          directement.
        </p>
        <div className="mt-6">
          <GuideCta href="/creer" label="Créer mon événement gratuitement" accent />
        </div>
      </GuideSection>

      <GuideSection
        id="petit-budget"
        title="Organiser un anniversaire avec un petit budget"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Un bel anniversaire ne dépend pas du budget mais de
          l&apos;attention aux détails. Quelques leviers concrets :
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
          Un anniversaire réussi tient souvent davantage à l&apos;ambiance
          et aux personnes présentes qu&apos;au montant dépensé.
        </p>
        <div className="mt-6">
          <GuideCta
            href="/prestataires"
            label="Trouvez vos prestataires d'anniversaire"
          />
        </div>
      </GuideSection>

      <GuideSection
        id="prestataires"
        title="Trouver vos prestataires pour un anniversaire"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Traiteur, DJ, décorateur, photographe : tous vérifiés avant
          publication sur Misstice.
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
          Vous êtes prestataire événementiel ?{" "}
          <Link
            href="/devenir-prestataire"
            className="font-semibold text-violet hover:text-violet-dark"
          >
            Rejoignez les prestataires vérifiés de Misstice
          </Link>
          .
        </p>
      </GuideSection>

      <GuideSection id="faq" title="Questions fréquentes">
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
