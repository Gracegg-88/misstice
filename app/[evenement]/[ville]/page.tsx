import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ComingSoon from "@/components/geo/ComingSoon";
import Breadcrumb from "@/components/geo/Breadcrumb";
import PicksList from "@/components/geo/PicksList";
import PicksMap from "@/components/geo/PicksMap";
import CityEventSections, { CityEventSources, CityPhoto } from "@/components/geo/CityEventSections";
import FeaturedVendorsSection from "@/components/geo/FeaturedVendorsSection";
import { FaqSection, LinkGroup, type FaqEntry } from "@/components/geo/SeoBlocks";
import { optimizedSrc } from "@/lib/img";
import { pageMetadata } from "@/lib/seo";
import {
  getEventCityState,
  getIndexableCityCategoryPages,
  getIndexableCityHubs,
  getIndexableEventCityPages,
  getSameRegionCities,
  plural,
} from "@/lib/seo-rules";
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
  slugify,
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
  // Fiche locale publiée (lieux, saison, budget…) : titre « guide local ».
  const richContent = isCityEventIndexable(content);
  const state = await getEventCityState(city.slug, eventType.slug);
  return pageMetadata({
    // Intention « guide » (≠ annuaire /prestataires/ville/…) : on parle
    // d'organiser l'événement, pas d'un métier. On n'annonce
    // lieux/budget/conseils que si la fiche locale existe vraiment.
    title: richContent
      ? `${label} à ${city.name} : lieux, budget et conseils`
      : `Organiser ${withArticle} à ${city.name} : guide et prestataires`,
    description: richContent
      ? `Organiser ${withArticle} à ${city.name} : lieux adaptés, saison, budget local et conseils pratiques pour préparer votre ${name} sereinement.`
      : `Préparer ${withArticle} à ${city.name} : étapes clés et prestataires locaux classés par métier. Centralisez budget, invités et devis sur Misstice.`,
    path: `/${eventType.slug}/${city.slug}`,
    // Photo principale de la fiche ville comme image de partage, si présente.
    images: content?.images?.[0]
      ? [
          {
            url: content.images[0].fichier,
            width: content.images[0].largeur,
            height: content.images[0].hauteur,
            alt: content.images[0].alt,
          },
        ]
      : undefined,
    // Règle unique : lib/seo-rules.ts (fiche publiée, ou texte rédigé + au
    // moins N prestataires réels dans la ville).
    noindex: !state.indexable,
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
  const otherEventTypes = eventTypes.filter((et) => et.slug !== eventType.slug);

  const [categoryPages, hubs, eventPages, regionCities] = await Promise.all([
    getIndexableCityCategoryPages(),
    getIndexableCityHubs(),
    getIndexableEventCityPages(),
    getSameRegionCities(city),
  ]);
  const indexablePaths = new Set([...categoryPages, ...hubs, ...eventPages].map((p) => p.path));

  // Intention « guide » : les prestataires sont présentés par métier (3 par
  // métier + lien vers l'annuaire filtré), pas en liste exhaustive — c'est
  // ce qui distingue cette page de /prestataires/ville/{ville}/{categorie}.
  const groupMap = new Map<string, { slug: string; label: string; vendors: typeof vendors }>();
  for (const v of vendors) {
    if (!v.category) continue;
    const slug = slugify(v.category);
    const g = groupMap.get(slug) ?? { slug, label: v.category, vendors: [] };
    g.vendors.push(v);
    groupMap.set(slug, g);
  }
  const groups = Array.from(groupMap.values()).sort((a, b) => b.vendors.length - a.vendors.length);

  const regionSlugs = new Set(regionCities.map((c) => c.slug));
  const nearbyGuides = eventPages
    .filter((p) => p.eventTypeSlug === eventType.slug && p.city.slug !== city.slug)
    .sort((a, b) => Number(regionSlugs.has(b.city.slug)) - Number(regionSlugs.has(a.city.slug)))
    .slice(0, 8)
    .map((p) => ({ href: p.path, label: `Organiser ${withArticle} à ${p.city.name}` }));
  const otherEventLinks = otherEventTypes
    .map((et) => ({ href: `/${et.slug}/${city.slug}`, label: `${eventGrammar(et).label} à ${city.name}` }))
    .filter((l) => indexablePaths.has(l.href));

  // FAQ : celle de la fiche locale si elle existe (affichée par
  // CityEventSections, données structurées ajoutées ici), sinon une FAQ
  // construite uniquement à partir de données réelles de l'annuaire.
  const contentFaq: FaqEntry[] = (content?.faq_locale ?? []).map((f) => ({ q: f.question, a: f.reponse }));
  const dataFaq: FaqEntry[] =
    contentFaq.length || !vendors.length
      ? []
      : [
          {
            q: `Quels prestataires trouver pour ${withArticle} à ${city.name} ?`,
            a: `Misstice référence ${plural(vendors.length, "prestataire", "prestataires")} à ${city.name}, dans ${plural(groups.length, "métier", "métiers")} : ${groups
              .slice(0, 6)
              .map((g) => `${g.label.toLowerCase()} (${g.vendors.length})`)
              .join(", ")}.`,
          },
          {
            q: `Comment organiser ${withArticle} à ${city.name} avec Misstice ?`,
            a: `Créez votre événement gratuitement, puis centralisez budget, invités et checklist. Demandez vos devis aux prestataires inscrits à ${city.name} : les coordonnées vous sont transmises dès que vous acceptez un devis.`,
          },
        ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <section className="mx-auto max-w-content px-page py-12">
          {/* Niveau intermédiaire = guide national de l'événement (ex.
              /organiser-un-mariage), qui existe pour chaque type ; chaque
              niveau avec lien porte son URL absolue (voir Breadcrumb). */}
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              ...(guide ? [{ label: `Organiser ${withArticle}`, href: guide.href }] : []),
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

          {content?.images?.[0] ? (
            <CityPhoto image={content.images[0]} eager />
          ) : image && (
            <figure className="mt-6 overflow-hidden rounded-3xl">
              <img
                src={optimizedSrc(image.url)}
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
              Voir l&apos;annuaire des prestataires à {city.name}
            </a>
          </div>

          {content && (
            <CityEventSections content={content} cityName={city.name} eventLabel={withArticle} />
          )}

          {guide && (
            <p className="mt-12 max-w-3xl leading-relaxed text-slate">
              Pour les étapes générales (budget type, checklist, calendrier), consultez notre{" "}
              <a href={guide.href} className="font-semibold text-violet hover:text-violet-dark">
                {guide.anchor}
              </a>
              {content && eventType.slug === "baby-shower"
                ? ` ; cette page se concentre sur ce qui change quand on prépare sa babyshower à ${city.name}.`
                : ` ; cette page se concentre sur ce qui est propre à ${city.name}.`}
            </p>
          )}

          {content && <CityEventSources content={content} />}

          {picks.length > 0 && (
            <div className="mt-12">
              <h2 className="font-display text-xl font-semibold text-plum">
                {label} à {city.name}&nbsp;: notre sélection
              </h2>
              <div className="mt-5">
                <PicksMap picks={picks} />
                <PicksList picks={picks} />
              </div>
            </div>
          )}

          {groups.length > 0 && (
            <section id="prestataires" className="mt-12 scroll-mt-28">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-plum">
                Les prestataires pour {withArticle} à {city.name}, par métier
              </h2>
              <p className="mt-3 max-w-3xl leading-relaxed text-slate">
                {plural(vendors.length, "prestataire référencé", "prestataires référencés")} à {city.name} dans{" "}
                {plural(groups.length, "métier", "métiers")}. Pour chaque métier, voici quelques fiches ; l&apos;annuaire
                détaillé permet de toutes les comparer.
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {groups.map((g) => {
                  const href = `/prestataires/ville/${city.slug}/${g.slug}`;
                  return (
                    <div key={g.slug} className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                      <h3 className="font-display text-lg font-semibold text-plum">
                        {g.label} <span className="text-sm font-normal text-slate">({g.vendors.length})</span>
                      </h3>
                      <ul className="mt-3 space-y-1.5 text-sm">
                        {g.vendors.slice(0, 3).map((v) => (
                          <li key={v.id}>
                            <a href={`/prestataires/${v.id}`} className="text-plum hover:text-violet">
                              {v.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                      {indexablePaths.has(href) && (
                        <a href={href} className="mt-4 inline-block text-sm font-semibold text-violet hover:text-violet-dark">
                          Voir les {g.vendors.length} fiches « {g.label} » à {city.name} →
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {featured.length > 0 && (
            <FeaturedVendorsSection featured={featured} eventName={name} cityName={city.name} />
          )}

          {vendors.length === 0 && picks.length === 0 && featured.length === 0 && (
            <div className="mt-8">
              <ComingSoon
                cityName={city.slug}
                cityLabel={`à ${city.name}`}
                eventTypeLabel={eventType.name}
                eventWithArticle={withArticle}
              />
            </div>
          )}

          {contentFaq.length > 0 ? (
            // FAQ déjà affichée par CityEventSections : uniquement les données structurées.
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: contentFaq.map((f) => ({
                    "@type": "Question",
                    name: f.q,
                    acceptedAnswer: { "@type": "Answer", text: f.a },
                  })),
                }),
              }}
            />
          ) : (
            <FaqSection items={dataFaq} />
          )}

          <LinkGroup title={`Autres événements à ${city.name}`} links={otherEventLinks} />
          <LinkGroup title={`Organiser ${withArticle} dans d'autres villes`} links={nearbyGuides} />
        </section>
      </main>
      <Footer />
    </>
  );
}
