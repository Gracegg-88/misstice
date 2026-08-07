import Link from "next/link";
import GuideLayout, { type TocItem } from "./GuideLayout";
import GuideSection from "./GuideSection";
import GuideBudgetTable, { type BudgetRow } from "./GuideBudgetTable";
import GuideChecklist, { type ChecklistPeriod } from "./GuideChecklist";
import GuideFaq, { type FaqItem } from "./GuideFaq";
import GuideCta from "./GuideCta";
import ScreenshotDashboard from "./ScreenshotDashboard";

const toc: TocItem[] = [
  { id: "budget", label: "Budget moyen" },
  { id: "checklist", label: "Checklist mois par mois" },
  { id: "petit-budget", label: "Petit budget" },
  { id: "prestataires", label: "Trouver vos prestataires" },
  { id: "faq", label: "FAQ" },
];

const placeholderBudgetRows: BudgetRow[] = [
  { poste: "[À COMPLÉTER]", paris: "[À COMPLÉTER]", province: "[À COMPLÉTER]" },
  { poste: "[À COMPLÉTER]", paris: "[À COMPLÉTER]", province: "[À COMPLÉTER]" },
  { poste: "[À COMPLÉTER]", paris: "[À COMPLÉTER]", province: "[À COMPLÉTER]" },
];

const placeholderChecklist: ChecklistPeriod[] = [
  { periode: "[À COMPLÉTER]", items: ["[À COMPLÉTER]", "[À COMPLÉTER]"] },
  { periode: "[À COMPLÉTER]", items: ["[À COMPLÉTER]", "[À COMPLÉTER]"] },
  { periode: "[À COMPLÉTER]", items: ["[À COMPLÉTER]", "[À COMPLÉTER]"] },
];

const placeholderFaq: FaqItem[] = [
  { q: "[À COMPLÉTER]", a: "[À COMPLÉTER]" },
  { q: "[À COMPLÉTER]", a: "[À COMPLÉTER]" },
  { q: "[À COMPLÉTER]", a: "[À COMPLÉTER]" },
];

/**
 * Squelette commun aux guides pas encore rédigés. Même structure que
 * /organiser-un-mariage (sommaire, budget, checklist, petit budget,
 * prestataires, FAQ) ; ne reste qu'à remplacer les [À COMPLÉTER].
 */
export default function GuidePlaceholderPage({
  heroImage,
  heroAlt,
  title,
  subtitle,
  eventLabel,
  eventLabelGenitive,
}: {
  heroImage: string;
  heroAlt: string;
  title: string;
  subtitle?: string;
  /** Ex. "un anniversaire", "une baby shower" (avec article). */
  eventLabel: string;
  /** Ex. "d'un anniversaire", "d'une baby shower". */
  eventLabelGenitive: string;
}) {
  return (
    <GuideLayout
      heroImage={heroImage}
      heroAlt={heroAlt}
      title={title}
      subtitle={subtitle}
      toc={toc}
    >
      <GuideSection
        id="budget"
        title={`Combien coûte ${eventLabel} en France en 2026`}
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          [À COMPLÉTER]
        </p>
        <div className="mt-5">
          <GuideBudgetTable rows={placeholderBudgetRows} />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          [À COMPLÉTER]
        </p>
      </GuideSection>

      <GuideSection id="checklist" title="La checklist, mois par mois">
        <GuideChecklist periods={placeholderChecklist} />
        <div className="mt-6">
          <ScreenshotDashboard type="checklist" />
        </div>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          [À COMPLÉTER]
        </p>
        <div className="mt-6">
          <GuideCta href="/creer" label="Créer mon événement gratuitement" />
        </div>
      </GuideSection>

      <GuideSection
        id="petit-budget"
        title={`Organiser ${eventLabel} avec un petit budget`}
      >
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          [À COMPLÉTER]
        </p>
        <ul className="mt-4 space-y-2.5">
          {[1, 2, 3].map((i) => (
            <li
              key={i}
              className="flex gap-2.5 text-sm leading-relaxed text-slate sm:text-base"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
              <span>[À COMPLÉTER]</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm leading-relaxed text-slate sm:text-base">
          [À COMPLÉTER]
        </p>
      </GuideSection>

      <GuideSection id="prestataires" title="Trouver vos prestataires">
        <p className="text-sm leading-relaxed text-slate sm:text-base">
          [À COMPLÉTER]
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

      <GuideSection
        id="faq"
        title={`Questions fréquentes sur l'organisation ${eventLabelGenitive}`}
      >
        <GuideFaq items={placeholderFaq} />
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
