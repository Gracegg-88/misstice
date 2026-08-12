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
  title: "Comment organiser un événement professionnel ou un gala",
  description:
    "Guide complet pour organiser un gala, un séminaire ou un événement d'entreprise : budget, checklist et prestataires vérifiés.",
  alternates: { canonical: "/organiser-un-evenement-professionnel" },
};

const toc = [
  { id: "budget", label: "Budget moyen" },
  { id: "checklist", label: "Checklist" },
  { id: "budget-maitrise", label: "Budget maîtrisé" },
  { id: "prestataires", label: "Trouver vos prestataires" },
  { id: "faq", label: "FAQ" },
];

const budgetRows: SimpleRow[] = [
  { poste: "Location de lieu", fourchette: "2 000 à 6 000 €" },
  { poste: "Traiteur (par personne)", fourchette: "60 à 120 €" },
  { poste: "Sonorisation et technique", fourchette: "1 000 à 3 000 €" },
  { poste: "Décoration et scénographie", fourchette: "1 500 à 4 000 €" },
  { poste: "Animation ou intervenant", fourchette: "1 000 à 5 000 €" },
  { poste: "Photographe ou vidéaste", fourchette: "800 à 2 000 €" },
];

const checklist: ChecklistPeriod[] = [
  {
    periode: "4 à 6 mois avant",
    items: [
      "Définissez l'objectif de l'événement et le budget global.",
      "Réservez le lieu et le traiteur.",
    ],
  },
  {
    periode: "2 à 3 mois avant",
    items: [
      "Réservez la technique (son, lumière) et l'animation.",
      "Lancez les invitations ou la billetterie.",
    ],
  },
  {
    periode: "1 mois avant",
    items: [
      "Confirmez le nombre définitif de participants.",
      "Finalisez le déroulé minute par minute.",
    ],
  },
  {
    periode: "Semaine de l'événement",
    items: ["Briefez chaque prestataire sur les horaires et le déroulé."],
  },
];

const budgetMaitriseTips = [
  "Choisissez un lieu qui inclut déjà la sonorisation de base, cela évite un poste technique séparé.",
  "Privilégiez un format cocktail plutôt qu'un dîner assis, qui réduit significativement le coût traiteur.",
  "Centralisez la coordination vous-même plutôt que de passer par une agence événementielle facturant ses honoraires en plus des prestataires.",
];

const faqItems: FaqItem[] = [
  {
    q: "Misstice convient-il aux événements d'entreprise, pas seulement aux particuliers ?",
    a: "Oui, la plateforme couvre aussi bien les événements personnels que professionnels, avec les mêmes garanties de vérification des prestataires.",
  },
  {
    q: "Faut-il une agence événementielle pour un gala d'entreprise ?",
    a: "Pas nécessairement. Une bonne centralisation des tâches, du budget et des prestataires remplace une grande partie de ce rôle de coordination.",
  },
];

export default function OrganiserUnEvenementProfessionnelPage() {
  return (
    <GuideLayout
      heroImage="/cowork.jpg"
      heroAlt="Collègues échangeant autour d'un verre lors d'un cocktail d'entreprise"
      title="Comment organiser un événement professionnel ou un gala"
      subtitle="Guide complet pour organiser un gala, un séminaire ou un événement d'entreprise : budget, checklist et prestataires vérifiés."
      toc={toc}
    >
      <Reveal className="space-y-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
          Pas besoin d&apos;être une multinationale pour organiser un bel
          événement professionnel
        </h2>
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          On associe souvent « événement d&apos;entreprise » à un gala à
          20 000 euros organisé par une agence spécialisée. En réalité, la
          majorité des événements professionnels en France sont organisés
          par des indépendants, des associations, des petites équipes ou
          des PME qui n&apos;ont ni le budget ni le temps de passer par une
          agence.
        </p>
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Un séminaire d&apos;équipe pour 8 personnes, une soirée de fin
          d&apos;année pour une petite structure, un lancement de produit
          pour une entreprise locale : ce sont exactement les événements
          pour lesquels Misstice a du sens. Vous n&apos;avez pas besoin
          d&apos;un service événementiel dédié en interne, juste des bons
          prestataires et une organisation centralisée.
        </p>
      </Reveal>

      <GuideSection id="budget" title="Combien coûte un événement professionnel">
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Précision avant le tableau : les chiffres ci-dessous concernent
          un format gala d&apos;une centaine de personnes, à titre
          d&apos;exemple. Un séminaire d&apos;équipe de 10 personnes ou une
          soirée entre collègues coûtera naturellement beaucoup moins.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate sm:text-base">
          Il n&apos;existe pas d&apos;étude officielle sur le budget moyen
          d&apos;un événement professionnel en France. Les chiffres
          ci-dessous sont une estimation à titre indicatif, à ajuster selon
          vos choix et votre région.
        </p>
        <div className="mt-5">
          <GuideSimpleTable rows={budgetRows} />
        </div>
      </GuideSection>

      <GuideSection id="checklist" title="La checklist événement professionnel">
        <GuideChecklist periods={checklist} />
        <GuideProductPreview />
        <p className="mt-6 text-sm leading-relaxed text-slate sm:text-base">
          Coordonner un événement professionnel implique souvent plusieurs
          prestataires en parallèle, chacun avec ses propres délais.
          Misstice centralise le budget, le planning et les échanges avec
          chaque prestataire au même endroit, pour éviter de tout suivre
          dans des emails séparés.
        </p>
        <div className="mt-6">
          <GuideCta href="/creer" label="Créer mon événement gratuitement" accent />
        </div>
      </GuideSection>

      <GuideSection
        id="budget-maitrise"
        title="Organiser un événement professionnel avec un budget maîtrisé"
      >
        <ul className="space-y-2.5">
          {budgetMaitriseTips.map((tip, i) => (
            <li
              key={i}
              className="flex gap-2.5 text-sm leading-relaxed text-slate sm:text-base"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection
        id="prestataires"
        title="Trouver vos prestataires pour un événement professionnel"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Traiteur, technique, décoration : tous vérifiés avant publication
          sur Misstice, y compris pour les événements d&apos;entreprise.
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
