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

export const metadata: Metadata = {
  title: "Comment organiser un baptême : étapes, budget et checklist",
  description:
    "Guide complet pour organiser un baptême civil ou religieux : budget moyen, checklist mois par mois, et comment trouver vos prestataires en toute confiance.",
  alternates: { canonical: "/organiser-un-bapteme" },
};

const toc = [
  { id: "budget", label: "Budget moyen" },
  { id: "checklist", label: "Checklist" },
  { id: "petit-budget", label: "Budget modeste" },
  { id: "prestataires", label: "Trouver vos prestataires" },
  { id: "faq", label: "FAQ" },
];

const budgetRows: SimpleRow[] = [
  { poste: "Salle ou lieu de réception", fourchette: "500 à 1 500 €" },
  { poste: "Traiteur (par personne)", fourchette: "25 à 50 €" },
  { poste: "Décoration", fourchette: "200 à 500 €" },
  { poste: "Photographe", fourchette: "400 à 900 €" },
  { poste: "Tenue de baptême", fourchette: "100 à 400 €" },
  { poste: "Faire-part et dragées", fourchette: "100 à 300 €" },
];

const checklist: ChecklistPeriod[] = [
  {
    periode: "3 mois avant",
    items: [
      "Fixez la date avec l'officiant (paroisse ou mairie) et réservez le lieu de réception.",
      "Établissez la liste d'invités.",
    ],
  },
  {
    periode: "6 à 8 semaines avant",
    items: [
      "Envoyez les faire-part.",
      "Réservez traiteur et photographe.",
    ],
  },
  {
    periode: "3 à 4 semaines avant",
    items: [
      "Choisissez la tenue de baptême et la décoration.",
      "Commandez les dragées et le gâteau.",
    ],
  },
  {
    periode: "1 semaine avant",
    items: [
      "Confirmez le nombre définitif d'invités auprès du traiteur.",
      "Préparez le déroulé de la journée (cérémonie puis réception).",
    ],
  },
];

const petitBudgetTips = [
  "Organisez la réception chez un proche plutôt que dans une salle louée.",
  "Simplifiez le traiteur à un brunch ou un buffet froid plutôt qu'un repas assis complet.",
  "Limitez les dragées et cadeaux invités à un geste simple plutôt qu'un poste de dépense important.",
];

const faqItems: FaqItem[] = [
  {
    q: "Quelle est la différence entre baptême civil et religieux pour l'organisation ?",
    a: "L'organisation de la réception reste identique, seule la cérémonie change de lieu et de forme.",
  },
  {
    q: "Combien de temps à l'avance organiser un baptême ?",
    a: "Environ 2 à 3 mois suffisent généralement, contre 8 à 12 mois pour un mariage.",
  },
];

export default function OrganiserUnBaptemePage() {
  return (
    <GuideLayout
      heroImage="/bapteme-photo.png"
      heroAlt="Famille souriante réunie dans une église pour un baptême"
      title="Comment organiser un baptême"
      subtitle="Étapes, budget moyen, checklist mois par mois, et comment trouver vos prestataires en toute confiance."
      toc={toc}
    >
      <Reveal>
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Entre la cérémonie, la réception et l&apos;implication de toute la
          famille, organiser un baptême demande de coordonner plusieurs
          personnes à la fois. Un minimum de structure permet de profiter
          pleinement du moment, sans courir après les derniers détails.
        </p>
      </Reveal>

      <GuideSection id="budget" title="Combien coûte un baptême">
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Pour une réception d&apos;une cinquantaine d&apos;invités,
          plusieurs guides spécialisés convergent vers une fourchette de
          1 500 à 5 000 euros. Voici une répartition indicative par poste.
        </p>
        <div className="mt-5">
          <GuideSimpleTable rows={budgetRows} />
        </div>
      </GuideSection>

      <GuideSection id="checklist" title="La checklist baptême">
        <GuideChecklist periods={checklist} />
        <div className="mx-auto mt-6 w-full max-w-[90%] overflow-hidden rounded-2xl border border-black/5 shadow-sm sm:max-w-[560px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/dashboard_checklist.png"
            alt="Aperçu de la checklist partagée sur le dashboard Misstice"
            className="w-full"
          />
        </div>
        <p className="mt-6 text-sm leading-relaxed text-slate sm:text-base">
          Un baptême implique souvent plusieurs membres de la famille dans
          l&apos;organisation, chacun avec sa part de responsabilité.
          Misstice permet de partager budget, checklist et contacts
          prestataires entre tous ceux qui participent, sans dépendre
          d&apos;un seul tableur envoyé par email.
        </p>
        <div className="mt-6">
          <GuideCta href="/creer" label="Créer mon événement gratuitement" accent />
        </div>
      </GuideSection>

      <GuideSection
        id="petit-budget"
        title="Organiser un baptême avec un budget modeste"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Le baptême reste souvent un événement plus intime que le mariage,
          ce qui laisse une vraie marge d&apos;ajustement.
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
        <div className="mt-6">
          <GuideCta
            href="/prestataires"
            label="Trouvez vos prestataires de baptême"
          />
        </div>
      </GuideSection>

      <GuideSection
        id="prestataires"
        title="Trouver vos prestataires pour un baptême"
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          Traiteur, photographe, décorateur : tous vérifiés avant
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
