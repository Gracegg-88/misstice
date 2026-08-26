import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedVendorsGrid from "@/components/FeaturedVendorsGrid";
import ComingSoon from "@/components/geo/ComingSoon";
import Breadcrumb from "@/components/geo/Breadcrumb";
import PicksList from "@/components/geo/PicksList";
import PicksMap from "@/components/geo/PicksMap";
import { getHeaderAccount } from "@/lib/header-account";
import {
  MIN_VERIFIED_VENDORS,
  getCityBySlug,
  getCityCategoryContent,
  getCityCategoryIntro,
  getCityCategoryPickCombos,
  getCityCategoryPicks,
  getIndexableCityCategoryCombos,
  getKnownCategorySlugs,
  getVendorsForCityCategory,
  slugify,
} from "@/lib/geo";

export const revalidate = 86400;

export async function generateStaticParams() {
  const [combos, editorialContent, pickCombos] = await Promise.all([
    getIndexableCityCategoryCombos(),
    getCityCategoryContent(),
    getCityCategoryPickCombos(),
  ]);
  // Publiée si assez de prestataires vérifiés, si un texte a été rédigé à la
  // main, OU si un Top 10 a été édité pour cette combinaison (même logique
  // que /[evenement]/[ville]).
  const byVendors = combos.map((c) => ({ ville: c.citySlug, categorie: c.categorySlug }));
  const byContent = editorialContent.map((c) => ({ ville: c.citySlug, categorie: slugify(c.category) }));
  const byPicks = pickCombos.map((c) => ({ ville: c.citySlug, categorie: c.categorySlug }));
  const seen = new Set<string>();
  return [...byVendors, ...byContent, ...byPicks].filter((p) => {
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
  if (!city) return { title: "Prestataires — Misstice" };
  const knownCategories = await getKnownCategorySlugs();
  const categoryLabel = knownCategories.get(params.categorie);
  if (!categoryLabel) return { title: "Prestataires — Misstice" };
  return {
    title: `${categoryLabel} à ${city.name} — Misstice`,
    description: `Comparez les ${categoryLabel.toLowerCase()} vérifiés à ${city.name}. Devis gratuits, avis vérifiés, tout centralisé sur Misstice.`,
    alternates: { canonical: `/prestataires/ville/${params.ville}/${params.categorie}` },
    openGraph: {
      title: `${categoryLabel} à ${city.name} — Misstice`,
      description: `Comparez les ${categoryLabel.toLowerCase()} vérifiés à ${city.name}. Devis gratuits, avis vérifiés, tout centralisé sur Misstice.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryLabel} à ${city.name} — Misstice`,
      description: `${categoryLabel} vérifiés à ${city.name} — devis gratuits sur Misstice.`,
    },
  };
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

  const [vendors, introText, picks, account] = await Promise.all([
    getVendorsForCityCategory(city.slug, params.categorie),
    getCityCategoryIntro(city.slug, params.categorie),
    getCityCategoryPicks(city.slug, params.categorie),
    getHeaderAccount(),
  ]);
  const verifiedCount = vendors.filter((v) => v.verified).length;
  const belowThreshold = verifiedCount < MIN_VERIFIED_VENDORS;

  return (
    <>
      <Header initialAccount={account} />
      <main className="min-h-screen bg-cream">
        <section className="mx-auto max-w-content px-5 py-12 sm:px-8">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Prestataires", href: "/prestataires" },
              { label: city.name, href: `/prestataires/ville/${city.slug}` },
              { label: categoryLabel },
            ]}
          />

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">{city.region}</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            {categoryLabel} à {city.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">
            {introText ??
              (belowThreshold
                ? picks.length
                  ? `Aucun ${categoryLabel.toLowerCase()} n'est encore inscrit sur Misstice à ${city.name}. En attendant les premiers profils vérifiés, voici notre sélection.`
                  : `Comparez bientôt les ${categoryLabel.toLowerCase()} vérifiés à ${city.name} : devis gratuits, avis vérifiés, échanges centralisés sur Misstice.`
                : `${verifiedCount} ${categoryLabel.toLowerCase()} vérifié${verifiedCount > 1 ? "s" : ""} à ${city.name}. Comparez les devis et réservez sans quitter Misstice.`)}
          </p>

          {belowThreshold ? (
            picks.length ? (
              <div className="mt-8">
                <PicksMap picks={picks} />
                <PicksList picks={picks} />
                <div className="mt-8 rounded-3xl bg-violet-soft px-6 py-8 text-center">
                  <p className="font-display text-lg font-semibold text-plum">
                    Vous êtes {categoryLabel.toLowerCase()} à {city.name}&nbsp;?
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
            ) : (
              <div className="mt-8">
                <ComingSoon cityName={city.slug} cityLabel={`à ${city.name}`} categoryLabel={categoryLabel} />
              </div>
            )
          ) : (
            <FeaturedVendorsGrid vendors={vendors} />
          )}

          <p className="mt-10 text-sm text-slate">
            <a href={`/prestataires/ville/${city.slug}`} className="font-semibold text-violet hover:text-violet-dark">
              ← Voir tous les prestataires à {city.name}
            </a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
