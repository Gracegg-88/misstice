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
  title: "Comment organiser une baby shower réussie : idées et budget",
  description:
    "Guide complet pour organiser une baby shower : budget moyen, checklist, idées de décoration et comment trouver vos prestataires.",
  alternates: { canonical: "/organiser-une-baby-shower" },
  openGraph: {
    title: "Comment organiser une baby shower réussie : idées et budget",
    description: "Guide complet pour organiser une baby shower : budget, checklist, idées de décoration et prestataires vérifiés.",
    type: "article",
  },
  twitter: { card: "summary_large_image", title: "Organiser une baby shower — Guide Misstice" },
};

const toc = [
  { id: "budget", label: "Budget moyen" },
  { id: "checklist", label: "Checklist" },
  { id: "petit-budget", label: "Petit budget" },
  { id: "prestataires", label: "Trouver vos prestataires" },
  { id: "faq", label: "FAQ" },
];

const budgetRows: SimpleRow[] = [
  { poste: "Lieu (souvent à domicile, gratuit)", fourchette: "0 à 300 €" },
  { poste: "Décoration", fourchette: "100 à 300 €" },
  { poste: "Traiteur ou buffet léger (par personne)", fourchette: "10 à 20 €" },
  { poste: "Gâteau et pâtisseries", fourchette: "50 à 150 €" },
  { poste: "Animations et jeux", fourchette: "30 à 100 €" },
];

const checklist: ChecklistPeriod[] = [
  {
    periode: "4 à 6 semaines avant",
    items: [
      "Fixez la date en accord avec la future maman et son entourage proche.",
      "Envoyez les invitations.",
    ],
  },
  {
    periode: "2 à 3 semaines avant",
    items: [
      "Planifiez la décoration et le thème.",
      "Commandez le gâteau et prévoyez le buffet.",
    ],
  },
  {
    periode: "1 semaine avant",
    items: [
      "Confirmez le nombre définitif d'invités.",
      "Préparez les jeux et animations.",
    ],
  },
];

const petitBudgetTips = [
  "Organisez-la à domicile plutôt que dans un lieu loué.",
  "Misez sur une décoration DIY (ballons, guirlandes) plutôt que sur des prestataires spécialisés.",
  "Proposez un buffet participatif où chaque invité apporte un plat.",
];

const faqItems: FaqItem[] = [
  {
    q: "Qui organise généralement une baby shower ?",
    a: "Traditionnellement les proches ou la famille de la future maman, pas elle-même.",
  },
  {
    q: "Combien de temps à l'avance organiser une baby shower ?",
    a: "4 à 6 semaines suffisent généralement, l'événement ayant lieu avant la naissance, dans le dernier trimestre de grossesse.",
  },
];

export default function OrganiserUneBabyShowerPage() {
  return (
    <GuideLayout
      heroImage="/babyshower-photo.png"
      heroAlt="Famille et amis célébrant une baby shower autour de la future maman"
      title="Comment organiser une baby shower"
      subtitle="Guide complet pour organiser une baby shower : budget moyen, checklist, idées de décoration et comment trouver vos prestataires."
      toc={toc}
      path="/organiser-une-baby-shower"
    >
      <Reveal>
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Une baby shower se prépare généralement par les proches, souvent
          en quelques semaines seulement. Entre la surprise à garder, la
          déco et le buffet, voici comment organiser un moment doux et bien
          pensé sans y laisser des heures.
        </p>
      </Reveal>

      <GuideSection id="budget" title="Combien coûte une baby shower">
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Pour une quinzaine à vingtaine d&apos;invités, comptez entre 300
          et 1 000 euros.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-slate sm:text-base">
          Il n&apos;existe pas d&apos;étude officielle sur le budget moyen
          d&apos;une baby shower en France. Les chiffres ci-dessous sont
          une estimation à titre indicatif, à ajuster selon vos choix et
          votre région.
        </p>
        <div className="mt-5">
          <GuideSimpleTable rows={budgetRows} />
        </div>
      </GuideSection>

      <GuideSection id="checklist" title="La checklist baby shower">
        <GuideChecklist periods={checklist} />
        <GuideProductPreview />
        <p className="mt-6 text-sm leading-relaxed text-slate sm:text-base">
          Une baby shower s&apos;organise souvent à plusieurs, entre sœurs,
          amies ou collègues, sans toujours se coordonner facilement.
          Misstice permet de partager la liste d&apos;invités, le budget et
          les tâches entre toutes les personnes impliquées, au même
          endroit.
        </p>
        <div className="mt-6">
          <GuideCta href="/creer" label="Créer mon événement gratuitement" accent />
        </div>
      </GuideSection>

      <GuideSection
        id="petit-budget"
        title="Organiser une baby shower avec un petit budget"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          La baby shower se prête particulièrement bien à un format
          modeste :
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
      </GuideSection>

      <GuideSection
        id="prestataires"
        title="Trouver vos prestataires pour une baby shower"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Décorateur, pâtissier, photographe : tous vérifiés avant
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
