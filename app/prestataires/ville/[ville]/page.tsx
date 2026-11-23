import type { Metadata } from "next";
import { pageMetadata, SITE_URL } from "@/lib/seo";
import { eventGrammar } from "@/lib/city-content";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedVendorsGrid from "@/components/FeaturedVendorsGrid";
import ComingSoon from "@/components/geo/ComingSoon";
import Breadcrumb from "@/components/geo/Breadcrumb";
import { FaqSection, ItemListSchema, LinkGroup, type FaqEntry } from "@/components/geo/SeoBlocks";
import { getCities, getCityBySlug, getEventTypes, getVendorsForCity, slugify } from "@/lib/geo";
import { getRegionContentFile, isRegionIndexable, regionSlug } from "@/lib/region-content";
import {
  getCityHubState,
  getIndexableCityCategoryPages,
  getIndexableCityHubs,
  getIndexableEventCityPages,
  getSameRegionCities,
  plural,
} from "@/lib/seo-rules";

// Régénère la page au plus une fois par jour : le nombre de prestataires
// évolue progressivement, pas besoin de temps réel.
export const revalidate = 86400;

// Toutes les villes connues, jamais seulement celles avec déjà un
// prestataire : la page gère elle-même le cas "aucun prestataire"
// (ComingSoon) et un generateStaticParams vide pour CE segment a déjà
// provoqué une 500 en prod sur ce type de route dynamique — jamais revenir
// à un filtre qui peut renvoyer un tableau vide ici.
export async function generateStaticParams() {
  const cities = await getCities();
  return cities.map((c) => ({ ville: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { ville: string };
}): Promise<Metadata> {
  const city = await getCityBySlug(params.ville);
  if (!city) return { title: "Prestataires" };
  const state = await getCityHubState(city.slug);
  return pageMetadata({
    title: state.listedCount
      ? `Prestataires événementiels à ${city.name} : ${plural(state.listedCount, "professionnel", "professionnels")}`
      : `Prestataires événementiels à ${city.name}`,
    description: state.listedCount
      ? `Annuaire des prestataires événementiels à ${city.name} (${city.region}) : ${plural(state.listedCount, "fiche", "fiches")} classées par métier. Comparez et demandez vos devis sur Misstice.`
      : `Prestataires événementiels à ${city.name} (${city.region}) : Misstice élargit son réseau dans cette ville.`,
    path: `/prestataires/ville/${city.slug}`,
    // Moins de N prestataires réels : noindex,follow (voir lib/seo-rules.ts).
    noindex: !state.indexable,
  });
}

export default async function VillePage({ params }: { params: { ville: string } }) {
  const city = await getCityBySlug(params.ville);
  if (!city) notFound();

  // Pas de getHeaderAccount() ici : cette page est statique/ISR
  // (generateStaticParams + revalidate), et cookies() (utilisé par
  // getHeaderAccount) y déclenche une erreur DYNAMIC_SERVER_USAGE pour
  // toute route pas déjà pré-générée — c'est exactement ce qui causait le
  // 500 en prod. Header sans initialAccount résout la session côté client.
  const [vendors, eventTypes, categoryPages, eventPages, hubs, regionCities] = await Promise.all([
    getVendorsForCity(city.slug),
    getEventTypes(),
    getIndexableCityCategoryPages(),
    getIndexableEventCityPages(),
    getIndexableCityHubs(),
    getSameRegionCities(city),
  ]);
  const verifiedCount = vendors.filter((v) => v.verified).length;

  // Métiers présents dans la ville, du plus fourni au moins fourni.
  const byCategory = new Map<string, { label: string; count: number }>();
  for (const v of vendors) {
    if (!v.category) continue;
    const slug = slugify(v.category);
    const entry = byCategory.get(slug) ?? { label: v.category, count: 0 };
    entry.count += 1;
    byCategory.set(slug, entry);
  }
  const categories = Array.from(byCategory.entries()).sort((a, b) => b[1].count - a[1].count);
  const indexableCategoryPaths = new Set(categoryPages.map((p) => p.path));

  // Maillage : uniquement vers des pages indexables.
  const categoryLinks = categories
    .map(([slug, c]) => ({ href: `/prestataires/ville/${city.slug}/${slug}`, label: `${c.label} à ${city.name} (${c.count})` }))
    .filter((l) => indexableCategoryPaths.has(l.href));
  const guideLinks = eventPages
    .filter((p) => p.city.slug === city.slug)
    .map((p) => {
      const et = eventTypes.find((e) => e.slug === p.eventTypeSlug);
      return { href: p.path, label: `Organiser ${et ? eventGrammar(et).withArticle : p.eventTypeSlug} à ${city.name}` };
    });
  const regionSlugs = new Set(regionCities.map((c) => c.slug));
  const nearbyHubs = hubs.filter((h) => regionSlugs.has(h.city.slug));
  const otherHubs = (nearbyHubs.length ? nearbyHubs : hubs.filter((h) => h.city.slug !== city.slug).slice(0, 6)).map(
    (h) => ({ href: h.path, label: `Prestataires à ${h.city.name}` })
  );

  // Hub de région : lien seulement s'il est publié (indexable).
  const regionLink = isRegionIndexable(getRegionContentFile(regionSlug(city.region)))
    ? [{ href: `/region/${regionSlug(city.region)}`, label: `Guide de la région ${city.region}` }]
    : [];

  const categorySummary = categories
    .slice(0, 5)
    .map(([, c]) => `${c.label.toLowerCase()} (${c.count})`)
    .join(", ");

  const faq: FaqEntry[] = vendors.length
    ? [
        {
          q: `Combien de prestataires événementiels sont référencés à ${city.name} sur Misstice ?`,
          a: `${plural(vendors.length, "fiche est actuellement référencée", "fiches sont actuellement référencées")} à ${city.name}, réparties en ${plural(categories.length, "métier", "métiers")}${categorySummary ? ` : ${categorySummary}` : ""}. ${plural(verifiedCount, "fiche est vérifiée", "fiches sont vérifiées")} par Misstice.`,
        },
        {
          q: "Que signifie « Fiche non réclamée » ?",
          a: "Ces fiches correspondent à de vraies entreprises du répertoire officiel des entreprises (SIRENE), qui n'ont pas encore rejoint Misstice. Le contact direct devient possible dès que l'entreprise réclame sa fiche.",
        },
        {
          q: `Comment demander un devis à un prestataire à ${city.name} ?`,
          a: "Ouvrez la fiche d'un prestataire inscrit puis cliquez sur « Demander un devis ». Les échanges se font sur Misstice ; les coordonnées du prestataire vous sont transmises dès que vous acceptez son devis.",
        },
      ]
    : [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <ItemListSchema
          name={`Prestataires événementiels à ${city.name}`}
          items={vendors.map((v) => ({ url: `${SITE_URL}/prestataires/${v.id}`, name: v.name }))}
        />
        <section className="mx-auto max-w-content px-page py-12">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Prestataires", href: "/prestataires" },
              { label: city.name },
            ]}
          />

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">{city.region}</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Prestataires événementiels à {city.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">
            {vendors.length > 0
              ? `L'annuaire Misstice référence ${plural(vendors.length, "prestataire", "prestataires")} à ${city.name}, classés par métier${categorySummary ? ` : ${categorySummary}` : ""}. Comparez les fiches, puis demandez vos devis aux professionnels inscrits sans quitter Misstice.`
              : `Misstice élargit son réseau de prestataires à ${city.name}.`}
          </p>

          <LinkGroup title={`Les métiers représentés à ${city.name}`} links={categoryLinks} />
          <LinkGroup title={`Guides pour organiser votre événement à ${city.name}`} links={guideLinks} />

          {vendors.length > 0 ? (
            <FeaturedVendorsGrid vendors={vendors} />
          ) : (
            <div className="mt-10">
              <ComingSoon cityName={city.slug} cityLabel={`à ${city.name}`} />
            </div>
          )}

          <FaqSection items={faq} />

          <LinkGroup
            title={nearbyHubs.length ? `Autres villes de la région ${city.region}` : "Prestataires dans d'autres villes"}
            links={[...regionLink, ...otherHubs]}
          />
        </section>
      </main>
      <Footer />
    </>
  );
}
