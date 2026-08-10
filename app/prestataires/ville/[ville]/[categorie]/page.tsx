import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedVendorsGrid from "@/components/FeaturedVendorsGrid";
import ComingSoon from "@/components/geo/ComingSoon";
import Breadcrumb from "@/components/geo/Breadcrumb";
import { getHeaderAccount } from "@/lib/header-account";
import {
  MIN_VERIFIED_VENDORS,
  getCityBySlug,
  getIndexableCityCategoryCombos,
  getKnownCategorySlugs,
  getVendorsForCityCategory,
} from "@/lib/geo";

export const revalidate = 86400;

export async function generateStaticParams() {
  const combos = await getIndexableCityCategoryCombos();
  return combos.map((c) => ({ ville: c.citySlug, categorie: c.categorySlug }));
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

  const [vendors, account] = await Promise.all([
    getVendorsForCityCategory(city.slug, params.categorie),
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
            {belowThreshold
              ? `Comparez bientôt les ${categoryLabel.toLowerCase()} vérifiés à ${city.name} : devis gratuits, avis vérifiés, échanges centralisés sur Misstice.`
              : `${verifiedCount} ${categoryLabel.toLowerCase()} vérifié${verifiedCount > 1 ? "s" : ""} à ${city.name}. Comparez les devis et réservez sans quitter Misstice.`}
          </p>

          {belowThreshold ? (
            <div className="mt-8">
              <ComingSoon cityName={city.slug} cityLabel={`à ${city.name}`} categoryLabel={categoryLabel} />
            </div>
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
