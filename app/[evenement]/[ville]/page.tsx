import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedVendorsGrid from "@/components/FeaturedVendorsGrid";
import ComingSoon from "@/components/geo/ComingSoon";
import Breadcrumb from "@/components/geo/Breadcrumb";
import PicksList from "@/components/geo/PicksList";
import PicksMap from "@/components/geo/PicksMap";
import CityEventSections, { CityEventSources } from "@/components/geo/CityEventSections";
import FeaturedVendorsSection from "@/components/geo/FeaturedVendorsSection";
import { pageMetadata } from "@/lib/seo";
import {
  ESSENTIAL_ROLES,
  EVENT_GUIDES,
  eventGrammar,
  getCityEventContentFile,
  getIndexableCityEventCombos,
  isCityEventIndexable,
  paragraphs,
} from "@/lib/city-content";
import {
  MIN_VERIFIED_VENDORS,
  getCityBySlug,
  getCityEventContent,
  getCityEventImage,
  getCityEventIntro,
  getCityEventPickCombos,
  getCityEventPicks,
  getEventTypeBySlug,
  getEventTypes,
  getFeaturedVendors,
  getIndexableCitySlugs,
  getVendorsForCity,
} from "@/lib/geo";

export const revalidate = 86400;

export async function generateStaticParams() {
  const [eventTypes, indexableCitySlugs, editorialContent, pickCombos] = await Promise.all([
    getEventTypes(),
    getIndexableCitySlugs(),
    getCityEventContent(),
    getCityEventPickCombos(),
  ]);
  // Publiée si assez de prestataires vérifiés, si un texte a été rédigé à la
  // main, OU si un Top 10 a été édité pour cette combinaison.
  const byVendors = eventTypes.flatMap((et) => indexableCitySlugs.map((ville) => ({ evenement: et.slug, ville })));
  const byContent = editorialContent.map((c) => ({ evenement: c.eventTypeSlug, ville: c.citySlug }));
  const byPicks = pickCombos.map((c) => ({ evenement: c.eventTypeSlug, ville: c.citySlug }));
  const byFiles = getIndexableCityEventCombos().map((c) => ({ evenement: c.eventTypeSlug, ville: c.citySlug }));
  const seen = new Set<string>();
  return [...byVendors, ...byContent, ...byPicks, ...byFiles].filter((p) => {
    const key = `${p.evenement}::${p.ville}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function generateMetadata({
  params,
}: {
  params: { evenement: string; ville: string };
}): Promise<Metadata> {
  const [eventType, city] = await Promise.all([
    getEventTypeBySlug(params.evenement),
    getCityBySlug(params.ville),
  ]);
  if (!eventType || !city) return { title: "Page introuvable" };
  const content = getCityEventContentFile(city.slug, eventType.slug);
  const { name, label, withArticle } = eventGrammar(eventType);
  const indexable = isCityEventIndexable(content);
  return pageMetadata({
    // Nom de l'événement (« baby shower ») + ville dans le titre et la
    // description. On n'annonce lieux/budget/conseils que si la fiche
    // locale existe vraiment.
    title: indexable
      ? `${label} à ${city.name} : lieux, budget et conseils`
      : `Organiser ${withArticle} à ${city.name}`,
    description: indexable
      ? `Organiser ${withArticle} à ${city.name} : lieux adaptés, saison, budget local et conseils pratiques pour préparer votre ${name} sereinement.`
      : `Organiser ${withArticle} à ${city.name} avec Misstice : budget, invités, checklist et demandes de devis réunis au même endroit.`,
    path: `/${eventType.slug}/${city.slug}`,
    // Fiche ville absente ou incomplète → noindex (voir lib/city-content.ts).
    noindex: !indexable,
  });
}

export default async function EvenementVillePage({
  params,
}: {
  params: { evenement: string; ville: string };
}) {
  const [eventType, city, eventTypes] = await Promise.all([
    getEventTypeBySlug(params.evenement),
    getCityBySlug(params.ville),
    getEventTypes(),
  ]);
  if (!eventType || !city) notFound();

  // Pas de getHeaderAccount() ici : voir la note dans
  // app/prestataires/ville/[ville]/page.tsx (DYNAMIC_SERVER_USAGE sur une
  // route statique/ISR pas encore pré-générée pour ce combo précis).
  const [vendors, introText, image, picks] = await Promise.all([
    getVendorsForCity(city.slug),
    getCityEventIntro(city.slug, eventType.slug),
    getCityEventImage(city.slug, eventType.slug),
    getCityEventPicks(city.slug, eventType.slug),
  ]);
  const content = getCityEventContentFile(city.slug, eventType.slug);
  // Formes accordées (« une baby shower », « ma baby shower ») pour tous les
  // titres, boutons et encadrés de la page.
  const { name, label, withArticle, possessive } = eventGrammar(eventType);
  const guide = EVENT_GUIDES[eventType.slug];
  const featured = await getFeaturedVendors(
    city.slug,
    content?.prestataires_mis_en_avant ?? [],
    ESSENTIAL_ROLES[eventType.slug] ?? []
  );
  const localIntro = paragraphs(content?.angle_local);
  const verifiedCount = vendors.filter((v) => v.verified).length;
  const belowThreshold = verifiedCount < MIN_VERIFIED_VENDORS;
  const featuredSection = <FeaturedVendorsSection featured={featured} eventName={name} cityName={city.name} />;
  // Dès qu'au moins un prestataire est retenu, la section « 3 prestataires »
  // prend la place de l'encadré « pas encore de prestataire vérifié » ; sans
  // aucun prestataire dans la ville, l'encadré reste affiché.
  const featuredInPlaceOfComingSoon = belowThreshold && picks.length === 0;
  const otherEventTypes = eventTypes.filter((et) => et.slug !== eventType.slug);
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.misstice.com/" },
      { "@type": "ListItem", position: 2, name: `Organiser ${withArticle} à ${city.name}`, item: `https://www.misstice.com/${eventType.slug}/${city.slug}` },
    ],
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <section className="mx-auto max-w-content px-page py-12">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label },
              { label: city.name },
            ]}
          />

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">{city.region}</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Organiser {withArticle} à {city.name}
          </h1>
          {localIntro.length > 0 ? (
            localIntro.map((p, i) => (
              <p key={i} className="mt-3 max-w-2xl leading-relaxed text-slate">
                {p}
              </p>
            ))
          ) : (
            <p className="mt-3 max-w-2xl leading-relaxed text-slate">
              {introText ??
                `Trouvez des prestataires vérifiés à ${city.name} et centralisez budget, invités, checklist et devis pour votre ${name}, du premier au dernier détail.`}
            </p>
          )}

          {image && (
            <figure className="mt-6 overflow-hidden rounded-3xl">
              <img
                src={image.url}
                alt={image.alt}
                className="h-64 w-full object-cover sm:h-80"
              />
              {image.alt && (
                <figcaption className="mt-2 text-xs text-slate">{image.alt}</figcaption>
              )}
            </figure>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/creer?type=${eventType.slug}&ville=${city.slug}`}
              className="inline-flex items-center justify-center rounded-2xl bg-violet px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:bg-violet-dark hover:shadow-xl"
            >
              Créer {possessive} à {city.name}
            </a>
            <a
              href={`/prestataires/ville/${city.slug}`}
              className="inline-flex items-center justify-center rounded-2xl border border-plum/15 bg-white px-6 py-3.5 text-sm font-semibold text-plum transition-colors hover:border-plum/30"
            >
              Voir tous les prestataires à {city.name}
            </a>
          </div>

          {content && (
            <CityEventSections content={content} cityName={city.name} eventLabel={withArticle} />
          )}

          {content && guide && (
            <p className="mt-12 max-w-3xl leading-relaxed text-slate">
              Pour les étapes générales (budget type, checklist, idées de décoration), consultez notre{" "}
              <a href={guide.href} className="font-semibold text-violet hover:text-violet-dark">
                {guide.anchor}
              </a>
              {eventType.slug === "baby-shower"
                ? ` ; cette page se concentre sur ce qui change quand on prépare sa babyshower à ${city.name}.`
                : ` ; cette page se concentre sur ce qui est propre à ${city.name}.`}
            </p>
          )}

          {content && <CityEventSources content={content} />}

          {vendors.length > 0 && !belowThreshold && (
            <p className="mt-8 text-sm text-slate">
              <span className="font-semibold text-plum">{verifiedCount}</span> prestataire
              {verifiedCount > 1 ? "s" : ""} vérifié{verifiedCount > 1 ? "s" : ""} référencé
              {verifiedCount > 1 ? "s" : ""} à {city.name}.
            </p>
          )}

          {belowThreshold ? (
            picks.length ? (
              <div className="mt-8">
                <p className="font-display text-xl font-semibold text-plum">
                  {label} à {city.name}&nbsp;: notre sélection
                </p>
                <div className="mt-5">
                  <PicksMap picks={picks} />
                  <PicksList picks={picks} />
                </div>
                <div className="mt-8 rounded-3xl bg-violet-soft px-6 py-8 text-center">
                  <p className="font-display text-lg font-semibold text-plum">
                    Vous êtes prestataire à {city.name}&nbsp;?
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate">
                    Rejoignez gratuitement les prestataires vérifiés de Misstice.
                  </p>
                  <a
                    href="/creer?type=pro"
                    className="ev-cta mt-4 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-cream"
                  >
                    Devenir prestataire
                  </a>
                </div>
              </div>
            ) : featured.length > 0 ? (
              featuredSection
            ) : (
              <div className="mt-8">
                <ComingSoon
                  cityName={city.slug}
                  cityLabel={`à ${city.name}`}
                  eventTypeLabel={eventType.name}
                  eventWithArticle={withArticle}
                />
              </div>
            )
          ) : (
            <FeaturedVendorsGrid vendors={vendors} />
          )}

          {!featuredInPlaceOfComingSoon && featuredSection}

          {otherEventTypes.length > 0 && (
            <div className="mt-12 border-t border-black/5 pt-8">
              <p className="text-sm font-semibold text-plum">Autres événements à {city.name}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {otherEventTypes.map((et) => (
                  <a
                    key={et.slug}
                    href={`/${et.slug}/${city.slug}`}
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-plum transition-colors hover:border-violet/30 hover:text-violet"
                  >
                    {eventGrammar(et).label} à {city.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
