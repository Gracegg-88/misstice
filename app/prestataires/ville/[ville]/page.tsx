import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FeaturedVendorsGrid from "@/components/FeaturedVendorsGrid";
import ComingSoon from "@/components/geo/ComingSoon";
import Breadcrumb from "@/components/geo/Breadcrumb";
import {
  getCities,
  getCityBySlug,
  getCityCategoryContent,
  getCityEventContent,
  getEventTypes,
  getIndexableCityCategoryCombos,
  getVendorsForCity,
  slugify,
} from "@/lib/geo";

// Régénère la page au plus une fois par jour : le nombre de prestataires
// évolue progressivement, pas besoin de temps réel.
export const revalidate = 86400;

// Toutes les villes connues, jamais seulement celles avec déjà un
// prestataire : la page gère elle-même le cas "aucun vérifié" (ComingSoon)
// et un generateStaticParams vide pour CE segment (aucune ville avec
// prestataire vérifié, ce qui arrive tant que l'annuaire démarre) a déjà
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
  if (!city) return { title: "Prestataires — Misstice" };
  return {
    title: `Prestataires événementiels à ${city.name} — Misstice`,
    description: `Traiteurs, photographes, DJ, salles de réception... découvrez les prestataires vérifiés à ${city.name} pour organiser votre événement avec Misstice.`,
    alternates: { canonical: `/prestataires/ville/${params.ville}` },
    openGraph: {
      title: `Prestataires événementiels à ${city.name} — Misstice`,
      description: `Traiteurs, photographes, DJ, salles de réception... découvrez les prestataires vérifiés à ${city.name} pour organiser votre événement avec Misstice.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Prestataires événementiels à ${city.name} — Misstice`,
      description: `Prestataires vérifiés à ${city.name} pour votre événement.`,
    },
  };
}

export default async function VillePage({ params }: { params: { ville: string } }) {
  const city = await getCityBySlug(params.ville);
  if (!city) notFound();

  // Pas de getHeaderAccount() ici : cette page est statique/ISR
  // (generateStaticParams + revalidate), et cookies() (utilisé par
  // getHeaderAccount) y déclenche une erreur DYNAMIC_SERVER_USAGE pour
  // toute route pas déjà pré-générée — c'est exactement ce qui causait le
  // 500 en prod. Header sans initialAccount résout la session côté client.
  const [vendors, combos, categoryContent, eventContent, eventTypes] = await Promise.all([
    getVendorsForCity(city.slug),
    getIndexableCityCategoryCombos(),
    getCityCategoryContent(),
    getCityEventContent(),
    getEventTypes(),
  ]);
  const verifiedCount = vendors.filter((v) => v.verified).length;

  // Une pastille "catégorie" apparaît soit parce que le seuil de
  // prestataires vérifiés est atteint, soit parce qu'un texte a été rédigé
  // à la main — sinon la page existe mais personne ne peut jamais y arriver
  // en cliquant depuis ce hub (c'est le bug qu'on vient de découvrir).
  const categoriesHere = new Map<string, string>();
  for (const c of combos) if (c.citySlug === city.slug) categoriesHere.set(c.categorySlug, c.category);
  for (const c of categoryContent) {
    if (c.citySlug === city.slug) categoriesHere.set(slugify(c.category), c.category);
  }

  const eventTypeName = new Map(eventTypes.map((et) => [et.slug, et.name]));
  const eventTypesHere = eventContent
    .filter((c) => c.citySlug === city.slug)
    .map((c) => ({ slug: c.eventTypeSlug, name: eventTypeName.get(c.eventTypeSlug) ?? c.eventTypeSlug }));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <section className="mx-auto max-w-content px-5 py-12 sm:px-8">
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
              ? `${verifiedCount} prestataire${verifiedCount > 1 ? "s" : ""} vérifié${verifiedCount > 1 ? "s" : ""} à ${city.name}, pour organiser mariage, anniversaire, baptême, gala ou baby shower sans quitter Misstice.`
              : `Misstice élargit son réseau de prestataires vérifiés à ${city.name}.`}
          </p>

          {categoriesHere.size > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {Array.from(categoriesHere.entries()).map(([categorySlug, category]) => (
                <a
                  key={categorySlug}
                  href={`/prestataires/ville/${city.slug}/${categorySlug}`}
                  className="rounded-full border border-violet/20 bg-violet-soft px-4 py-2 text-sm font-medium text-violet transition-colors hover:bg-violet/10"
                >
                  {category}
                </a>
              ))}
            </div>
          )}

          {eventTypesHere.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {eventTypesHere.map((et) => (
                <a
                  key={et.slug}
                  href={`/${et.slug}/${city.slug}`}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-plum transition-colors hover:border-violet/30 hover:text-violet"
                >
                  Organiser un {et.name.toLowerCase()} à {city.name}
                </a>
              ))}
            </div>
          )}

          {vendors.length > 0 ? (
            <FeaturedVendorsGrid vendors={vendors} />
          ) : (
            <div className="mt-10">
              <ComingSoon cityName={city.slug} cityLabel={`à ${city.name}`} />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
