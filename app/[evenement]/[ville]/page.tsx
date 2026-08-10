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
  getCityEventContent,
  getCityEventIntro,
  getEventTypeBySlug,
  getEventTypes,
  getIndexableCitySlugs,
  getVendorsForCity,
} from "@/lib/geo";

export const revalidate = 86400;

export async function generateStaticParams() {
  const [eventTypes, indexableCitySlugs, editorialContent] = await Promise.all([
    getEventTypes(),
    getIndexableCitySlugs(),
    getCityEventContent(),
  ]);
  // Publiée si assez de prestataires vérifiés OU si un texte a été rédigé à
  // la main pour cette combinaison — les deux justifient la page séparément.
  const byVendors = eventTypes.flatMap((et) => indexableCitySlugs.map((ville) => ({ evenement: et.slug, ville })));
  const byContent = editorialContent.map((c) => ({ evenement: c.eventTypeSlug, ville: c.citySlug }));
  const seen = new Set<string>();
  return [...byVendors, ...byContent].filter((p) => {
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
  if (!eventType || !city) return { title: "Misstice" };
  return {
    title: `Organiser un ${eventType.name.toLowerCase()} à ${city.name} — Misstice`,
    description: `Prestataires vérifiés et organisation centralisée pour un ${eventType.name.toLowerCase()} à ${city.name} : budget, invités, checklist et devis, tout dans Misstice.`,
  };
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

  const [vendors, introText, account] = await Promise.all([
    getVendorsForCity(city.slug),
    getCityEventIntro(city.slug, eventType.slug),
    getHeaderAccount(),
  ]);
  const verifiedCount = vendors.filter((v) => v.verified).length;
  const belowThreshold = verifiedCount < MIN_VERIFIED_VENDORS;
  const otherEventTypes = eventTypes.filter((et) => et.slug !== eventType.slug);

  return (
    <>
      <Header initialAccount={account} />
      <main className="min-h-screen bg-cream">
        <section className="mx-auto max-w-content px-5 py-12 sm:px-8">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: eventType.name },
              { label: city.name },
            ]}
          />

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">{city.region}</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Organiser un {eventType.name.toLowerCase()} à {city.name}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-slate">
            {introText ??
              `Trouvez des prestataires vérifiés à ${city.name} et centralisez budget, invités, checklist et devis pour votre ${eventType.name.toLowerCase()}, du premier au dernier détail.`}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`/creer?type=${eventType.slug}&ville=${city.slug}`}
              className="inline-flex items-center justify-center rounded-2xl bg-violet px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:bg-violet-dark hover:shadow-xl"
            >
              Créer mon {eventType.name.toLowerCase()} à {city.name}
            </a>
            <a
              href={`/prestataires/ville/${city.slug}`}
              className="inline-flex items-center justify-center rounded-2xl border border-plum/15 bg-white px-6 py-3.5 text-sm font-semibold text-plum transition-colors hover:border-plum/30"
            >
              Voir tous les prestataires à {city.name}
            </a>
          </div>

          {vendors.length > 0 && !belowThreshold && (
            <p className="mt-8 text-sm text-slate">
              <span className="font-semibold text-plum">{verifiedCount}</span> prestataire
              {verifiedCount > 1 ? "s" : ""} vérifié{verifiedCount > 1 ? "s" : ""} référencé
              {verifiedCount > 1 ? "s" : ""} à {city.name}.
            </p>
          )}

          {belowThreshold ? (
            <div className="mt-8">
              <ComingSoon cityName={city.slug} cityLabel={`à ${city.name}`} eventTypeLabel={eventType.name} />
            </div>
          ) : (
            <FeaturedVendorsGrid vendors={vendors} />
          )}

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
                    {et.name} à {city.name}
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
