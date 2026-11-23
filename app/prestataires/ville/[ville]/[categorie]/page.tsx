import type { Metadata } from "next";
import { optimizedSrc } from "@/lib/img";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedVendorsGrid from "@/components/FeaturedVendorsGrid";
import ComingSoon from "@/components/geo/ComingSoon";
import Breadcrumb from "@/components/geo/Breadcrumb";
import PicksList from "@/components/geo/PicksList";
import PicksMap from "@/components/geo/PicksMap";
import { FaqSection, ItemListSchema, LinkGroup, type FaqEntry } from "@/components/geo/SeoBlocks";
import { eventGrammar } from "@/lib/city-content";
import {
  getCityBySlug,
  getCityCategoryContent,
  getCityCategoryImage,
  getCityCategoryIntro,
  getCityCategoryPickCombos,
  getCityCategoryPicks,
  getEventTypes,
  getIndexableCityCategoryCombos,
  getKnownCategorySlugs,
  getVendorsForCityCategory,
  slugify,
} from "@/lib/geo";
import {
  getCityCategoryState,
  getIndexableCityCategoryPages,
  getIndexableCityHubs,
  getIndexableEventCityPages,
  getSameRegionCities,
  plural,
} from "@/lib/seo-rules";

export const revalidate = 86400;

export async function generateStaticParams() {
  const [combos, editorialContent, pickCombos, indexable] = await Promise.all([
    getIndexableCityCategoryCombos(),
    getCityCategoryContent(),
    getCityCategoryPickCombos(),
    getIndexableCityCategoryPages(),
  ]);
  // Pré-générées : pages indexables + pages avec texte rédigé ou Top 10.
  const byVendors = combos.map((c) => ({ ville: c.citySlug, categorie: c.categorySlug }));
  const byContent = editorialContent.map((c) => ({ ville: c.citySlug, categorie: slugify(c.category) }));
  const byPicks = pickCombos.map((c) => ({ ville: c.citySlug, categorie: c.categorySlug }));
  const byIndex = indexable.map((p) => ({ ville: p.city.slug, categorie: p.categorySlug }));
  const seen = new Set<string>();
  return [...byIndex, ...byVendors, ...byContent, ...byPicks].filter((p) => {
    const key = `${p.ville}::${p.categorie}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function generateMetadata({
  params,
}: {
  params: { ville: string; categorie: string };
}): Promise<Metadata> {
  const city = await getCityBySlug(params.ville);
  if (!city) return { title: "Prestataires" };
  const knownCategories = await getKnownCategorySlugs();
  const categoryLabel = knownCategories.get(params.categorie);
  if (!categoryLabel) return { title: "Prestataires" };
  const state = await getCityCategoryState(city.slug, params.categorie);
  // Intention « annuaire filtré » (≠ guide /{evenement}/{ville}) : le titre
  // parle d'un métier et d'un nombre de professionnels à comparer.
  return pageMetadata({
    title: state.listedCount
      ? `${categoryLabel} à ${city.name} : ${plural(state.listedCount, "professionnel", "professionnels")} à comparer`
      : `${categoryLabel} à ${city.name}`,
    description: state.listedCount
      ? `Annuaire « ${categoryLabel} » à ${city.name} : ${plural(state.listedCount, "fiche", "fiches")} à comparer. Demandez vos devis aux professionnels inscrits sur Misstice.`
      : `${categoryLabel} à ${city.name} : Misstice référence bientôt des professionnels dans cette ville.`,
    path: `/prestataires/ville/${city.slug}/${params.categorie}`,
    // Moins de N prestataires réels : noindex,follow (voir lib/seo-rules.ts).
    noindex: !state.indexable,
  });
}

export default async function VilleCategoriePage({
  params,
}: {
  params: { ville: string; categorie: string };
}) {
  const city = await getCityBySlug(params.ville);
  if (!city) notFound();

  const knownCategories = await getKnownCategorySlugs();
  const categoryLabel = knownCategories.get(params.categorie);
  // La catégorie n'existe nulle part dans l'annuaire : URL invalide → 404.
  // (Différent d'une catégorie réelle juste absente de cette ville, cf. plus bas.)
  if (!categoryLabel) notFound();

  // Pas de getHeaderAccount() ici : voir la note dans
  // app/prestataires/ville/[ville]/page.tsx (DYNAMIC_SERVER_USAGE sur une
  // route statique/ISR pas encore pré-générée pour ce combo précis).
  const [vendors, introText, image, picks, categoryPages, hubs, eventPages, eventTypes, regionCities] =
    await Promise.all([
      getVendorsForCityCategory(city.slug, params.categorie),
      getCityCategoryIntro(city.slug, params.categorie),
      getCityCategoryImage(city.slug, params.categorie),
      getCityCategoryPicks(city.slug, params.categorie),
      getIndexableCityCategoryPages(),
      getIndexableCityHubs(),
      getIndexableEventCityPages(),
      getEventTypes(),
      getSameRegionCities(city),
    ]);
  const verifiedCount = vendors.filter((v) => v.verified).length;
  const label = categoryLabel.toLowerCase();

  // Maillage interne, uniquement vers des pages indexables.
  const otherCategories = categoryPages
    .filter((p) => p.city.slug === city.slug && p.categorySlug !== params.categorie)
    .map((p) => ({ href: p.path, label: `${p.category} à ${city.name}` }));
  const regionSlugs = new Set(regionCities.map((c) => c.slug));
  const sameCategoryElsewhere = categoryPages
    .filter((p) => p.categorySlug === params.categorie && p.city.slug !== city.slug)
    .sort((a, b) => Number(regionSlugs.has(b.city.slug)) - Number(regionSlugs.has(a.city.slug)))
    .slice(0, 8)
    .map((p) => ({ href: p.path, label: `${categoryLabel} à ${p.city.name}` }));
  const hubLink = hubs.find((h) => h.city.slug === city.slug);
  const guideLinks = eventPages
    .filter((p) => p.city.slug === city.slug)
    .map((p) => {
      const et = eventTypes.find((e) => e.slug === p.eventTypeSlug);
      return { href: p.path, label: `Organiser ${et ? eventGrammar(et).withArticle : p.eventTypeSlug} à ${city.name}` };
    });

  const intro =
    introText ??
    (vendors.length
      ? `${plural(vendors.length, "fiche", "fiches")} dans la catégorie « ${categoryLabel} » à ${city.name}${verifiedCount ? `, dont ${plural(verifiedCount, "vérifiée", "vérifiées")} par Misstice` : ""}. Comparez les profils, les prestations et les tarifs affichés, puis demandez vos devis aux professionnels inscrits sans quitter Misstice.`
      : picks.length
        ? `Aucun professionnel de la catégorie « ${categoryLabel} » n'est encore inscrit sur Misstice à ${city.name}. En attendant les premiers profils, voici notre sélection.`
        : `Comparez bientôt les professionnels de la catégorie « ${categoryLabel} » à ${city.name} : devis gratuits et échanges centralisés sur Misstice.`);

  const faq: FaqEntry[] = vendors.length
    ? [
        {
          q: `Combien de professionnels « ${categoryLabel} » trouve-t-on à ${city.name} sur Misstice ?`,
          a: `${plural(vendors.length, "fiche est actuellement référencée", "fiches sont actuellement référencées")} à ${city.name} dans cette catégorie, dont ${plural(verifiedCount, "vérifiée", "vérifiées")} par Misstice. Les autres sont des fiches d'entreprises réelles qui n'ont pas encore rejoint Misstice.`,
        },
        {
          q: `Comment comparer les ${label} à ${city.name} ?`,
          a: "Chaque fiche présente les prestations, les tarifs indiqués par le professionnel et les avis. Demandez plusieurs devis sur la même base (date, nombre d'invités, prestations souhaitées) pour les comparer facilement.",
        },
        {
          q: "Quand reçoit-on les coordonnées du prestataire ?",
          a: "Les échanges se font sur Misstice ; les coordonnées du prestataire vous sont transmises dès que vous acceptez son devis.",
        },
      ]
    : [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <ItemListSchema
          name={`${categoryLabel} à ${city.name}`}
          items={vendors.map((v) => ({ url: `${SITE_URL}/prestataires/${v.id}`, name: v.name }))}
        />
        <section className="mx-auto max-w-content px-page py-12">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Prestataires", href: "/prestataires" },
              { label: city.name, href: `/prestataires/ville/${city.slug}` },
              { label: categoryLabel },
            ]}
          />

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
            Annuaire · {city.region}
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            {categoryLabel} à {city.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">{intro}</p>

          {image && (
            <figure className="mt-6 overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedSrc(image.url)} alt={image.alt} className="h-64 w-full object-cover sm:h-80" />
              {image.alt && <figcaption className="mt-2 text-xs text-slate">{image.alt}</figcaption>}
            </figure>
          )}

          {/* Liste rendue côté serveur dès qu'il y a des prestataires réels
              (avant : seulement à partir de 3 fiches VÉRIFIÉES, jamais atteint). */}
          {vendors.length > 0 && <FeaturedVendorsGrid vendors={vendors} />}

          {picks.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display text-xl font-semibold text-plum">
                Notre sélection : {label} à {city.name}
              </h2>
              <div className="mt-5">
                <PicksMap picks={picks} />
                <PicksList picks={picks} />
              </div>
            </div>
          )}

          {vendors.length === 0 && picks.length === 0 && (
            <div className="mt-8">
              <ComingSoon cityName={city.slug} cityLabel={`à ${city.name}`} categoryLabel={categoryLabel} />
            </div>
          )}

          {vendors.length < 3 && (
            <div className="mt-8 rounded-3xl bg-violet-soft px-6 py-8 text-center">
              <p className="font-display text-lg font-semibold text-plum">
                Vous êtes {label} à {city.name}&nbsp;?
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
          )}

          <FaqSection items={faq} />

          <LinkGroup title={`Autres métiers à ${city.name}`} links={otherCategories} />
          <LinkGroup title={`${categoryLabel} dans d'autres villes`} links={sameCategoryElsewhere} />
          <LinkGroup title={`Guides pour organiser votre événement à ${city.name}`} links={guideLinks} />

          <p className="mt-10 text-sm text-slate">
            <a href={`/prestataires/ville/${city.slug}`} className="font-semibold text-violet hover:text-violet-dark">
              ← Voir tous les prestataires à {city.name}
              {hubLink ? ` (${hubLink.listedCount})` : ""}
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
