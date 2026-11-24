import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { notFound, permanentRedirect } from "next/navigation";
import Breadcrumb from "@/components/geo/Breadcrumb";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCityBySlug, getEventTypes, getVendorsForCityCategory, slugify } from "@/lib/geo";
import { eventGrammar } from "@/lib/city-content";
import {
  getCityCategoryState,
  getCityHubState,
  getIndexableEventCityPages,
  getVendorProfileSignals,
  isVendorProfileIndexable,
} from "@/lib/seo-rules";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VendorProfile from "@/components/explorer/VendorProfile";
import { createClient } from "@/lib/supabase/server";
import {
  getVendor,
  isPubliclyVisible,
  getPublicPackages,
  getPublicPhotos,
  getVendorReviews,
  getReviewStats,
  getNextAvailability,
} from "@/lib/vendors";
import { getPackages } from "@/components/explorer/profileData";
import { getCurrentEvent } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const vendor = await getVendor(params.id);
  if (!vendor || !isPubliclyVisible(vendor)) return { title: "Prestataire", robots: { index: false, follow: true } };
  return pageMetadata({
    title: `${vendor.name}, ${vendor.category.toLowerCase()} à ${vendor.city}`,
    // Jamais « prestataire vérifié » par défaut : la plupart des fiches sont
    // des vitrines non réclamées.
    description:
      vendor.tagline || `Découvrez la fiche de ${vendor.name}, ${vendor.category.toLowerCase()} à ${vendor.city}, sur Misstice.`,
    path: `/prestataires/${vendor.id}`,
    type: "profile",
    // Fiche vitrine importée ou sans description : consultable mais pas
    // indexée (critères automatiques : isVendorProfileIndexable dans
    // lib/seo-rules.ts).
    noindex: !(await vendorIsIndexable(vendor)),
  });
}

export default async function VendorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { devis?: string };
}) {
  const vendor = await getVendor(params.id);
  if (!vendor) {
    // Fiche retirée : redirection permanente vers sa page ville/métier
    // (ou la ville, ou l'annuaire). Fiche inexistante : vraie 404 serveur.
    const target = await retiredVendorRedirect(params.id);
    if (target) permanentRedirect(target);
    notFound();
  }
  // Même règle que l'annuaire : une fiche réclamée non vérifiée n'est pas
  // publique. Seuls son propriétaire (aperçu depuis l'espace pro) et un admin
  // peuvent l'ouvrir.
  if (!isPubliclyVisible(vendor) && !(await canPreview(vendor.userId ?? null))) notFound();

  // Formules & book réels si le prestataire est inscrit, sinon démo.
  const [realPackages, photos, reviews, stats, currentEvent, nextAvailability] =
    await Promise.all([
      vendor.userId ? getPublicPackages(vendor.userId) : Promise.resolve([]),
      vendor.userId ? getPublicPhotos(vendor.userId) : Promise.resolve([]),
      getVendorReviews(vendor.id),
      getReviewStats(vendor.id),
      getCurrentEvent(),
      vendor.userId
        ? getNextAvailability(vendor.userId)
        : Promise.resolve(null),
    ]);
  // Contenu démo (forfaits d'exemple) UNIQUEMENT pour les anciennes fiches de
  // démonstration (sans compte, claim_status='reclamee' par défaut). Un vrai
  // compte non rempli, ou une fiche vitrine importée depuis SIRENE
  // (claim_status='non_reclamee'), affiche un état vide — jamais de contenu
  // inventé sur une vraie entreprise.
  const packages = realPackages.length
    ? realPackages
    : vendor.userId || vendor.claimStatus === "non_reclamee"
      ? []
      : getPackages(vendor);

  // Pré-remplissage de la demande de devis avec l'événement en cours (le cas
  // échéant) — utile depuis le dashboard particulier.
  const prefill = currentEvent
    ? {
        type: currentEvent.type,
        date: currentEvent.event_date,
        guests: currentEvent.guest_count || null,
      }
    : null;

  // La note affichée reflète les avis réels dès qu'il y en a ; sinon on garde
  // la note de la fiche (cohérent avec les cartes de l'annuaire).
  const vendorWithRating =
    stats.count > 0
      ? { ...vendor, rating: stats.avg, reviews: stats.count }
      : vendor;
  // Données structurées LocalBusiness uniquement pour les fiches complètes
  // (indexables) : pas de balisage « entreprise » sur une vitrine vide.
  const indexable = isVendorProfileIndexable({ ...vendor, about: vendor.about, photoCount: photos.length });
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: vendor.name,
    description: vendor.tagline || undefined,
    url: `https://www.misstice.com/prestataires/${vendor.id}`,
    image: vendor.img || undefined,
    address: vendor.city
      ? { "@type": "PostalAddress", addressLocality: vendor.city, addressCountry: "FR" }
      : undefined,
    aggregateRating: stats.count > 0
      ? { "@type": "AggregateRating", ratingValue: stats.avg, reviewCount: stats.count, bestRating: 5, worstRating: 1 }
      : undefined,
  };

  const geo = await vendorGeoLinks(vendor.city, vendor.category);

  return (
    <>
      <Header />
      <main>
        {indexable && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
        )}
        <div className="mx-auto max-w-content px-page pt-6">
          <Breadcrumb
            items={[
              { label: "Accueil", href: "/" },
              { label: "Prestataires", href: "/prestataires" },
              ...(geo.cityHref ? [{ label: geo.cityName, href: geo.cityHref }] : []),
              ...(geo.categoryHref ? [{ label: vendor.category, href: geo.categoryHref }] : []),
              { label: vendor.name },
            ]}
          />
          {vendor.claimStatus === "non_reclamee" && (
            <div className="mt-4 flex flex-col gap-3 rounded-3xl border-2 border-violet/30 bg-violet-soft px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-display text-lg font-semibold text-plum">
                Vous êtes {vendor.name}&nbsp;? Réclamez gratuitement votre fiche
              </p>
              <a
                href={`/creer?type=pro&reclamer=${vendor.id}`}
                className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
              >
                Réclamer ma fiche
              </a>
            </div>
          )}
        </div>
        <VendorProfile
          vendor={vendorWithRating}
          packages={packages}
          reviews={reviews}
          breakdown={stats.breakdown}
          photos={photos}
          prefill={prefill}
          autoDevis={searchParams?.devis === "1"}
          currentEventId={currentEvent?.id ?? null}
          nextAvailability={nextAvailability}
        />
        {vendor.claimStatus === "non_reclamee" && (
          <ImportedVendorDetails
            vendorId={vendor.id}
            city={vendor.city}
            category={vendor.category}
          />
        )}
        {geo.moreHref && (
          <p className="mx-auto max-w-content px-page pb-10 text-sm">
            <a href={geo.moreHref} className="font-semibold text-violet hover:text-violet-dark">
              {geo.moreLabel}
            </a>
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}

/**
 * Fiche importée (non réclamée) : uniquement de la navigation utile —
 * d'autres professionnels du même métier dans la ville et le guide de la
 * ville. Aucune donnée d'entreprise (SIRET, etc.) n'est affichée sur une
 * fiche que l'entreprise n'a pas réclamée.
 */
async function ImportedVendorDetails({
  vendorId,
  city,
  category,
}: {
  vendorId: string;
  city: string;
  category: string;
}) {
  const citySlug = slugify(city);
  const cityRow = city ? await getCityBySlug(citySlug) : null;
  const [sameCategory, geo, eventPages, eventTypes] = await Promise.all([
    cityRow ? getVendorsForCityCategory(cityRow.slug, slugify(category)) : Promise.resolve([]),
    vendorGeoLinks(city, category),
    getIndexableEventCityPages(),
    getEventTypes(),
  ]);
  const others = sameCategory.filter((v) => v.id !== vendorId).slice(0, 6);
  const guides = cityRow
    ? eventPages
        .filter((p) => p.city.slug === cityRow.slug)
        .map((p) => {
          const et = eventTypes.find((e) => e.slug === p.eventTypeSlug);
          return { href: p.path, label: `Organiser ${et ? eventGrammar(et).withArticle : p.eventTypeSlug} à ${cityRow.name}` };
        })
    : [];
  const cityLabel = cityRow?.name ?? city;

  return (
    <section className="mx-auto max-w-content px-page pb-6">
      <div className="grid gap-4 md:grid-cols-2">
        {(guides.length > 0 || geo.cityHref) && (
          <div className="rounded-3xl border border-black/5 bg-white p-6">
            <h2 className="font-display text-lg font-semibold text-plum">Organiser votre événement à {cityLabel}</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {guides.map((g) => (
                <li key={g.href}>
                  <a href={g.href} className="font-semibold text-violet hover:text-violet-dark">{g.label}</a>
                </li>
              ))}
              {geo.cityHref && (
                <li>
                  <a href={geo.cityHref} className="font-semibold text-violet hover:text-violet-dark">
                    Tous les prestataires à {cityLabel}
                  </a>
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
      {others.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg font-semibold text-plum">
            Autres « {category} » à {cityLabel}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((v) => (
              <li key={v.id}>
                <a
                  href={`/prestataires/${v.id}`}
                  className="inline-block rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-plum transition-colors hover:border-violet/30 hover:text-violet"
                >
                  {v.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

/**
 * Liens de la fiche vers sa ville et son métier. Le fil d'Ariane suit la
 * hiérarchie réelle ; le lien « voir d'autres… » ne pointe que vers une
 * page indexable (annuaire ville × métier, sinon annuaire de la ville).
 */
async function vendorGeoLinks(cityName: string, category: string) {
  const city = cityName ? await getCityBySlug(slugify(cityName)) : null;
  if (!city) return { cityName, cityHref: null, categoryHref: null, moreHref: null, moreLabel: "" };
  const categorySlug = slugify(category);
  const cityHref = `/prestataires/ville/${city.slug}`;
  const categoryHref = `${cityHref}/${categorySlug}`;
  const [catState, hubState] = await Promise.all([
    getCityCategoryState(city.slug, categorySlug),
    getCityHubState(city.slug),
  ]);
  const more = catState.indexable
    ? { moreHref: categoryHref, moreLabel: `Voir les autres fiches « ${category} » à ${city.name} →` }
    : hubState.indexable
      ? { moreHref: cityHref, moreLabel: `Voir tous les prestataires à ${city.name} →` }
      : { moreHref: null, moreLabel: "" };
  return { cityName: city.name, cityHref, categoryHref, ...more };
}

/**
 * Cible de redirection d'une fiche retirée (retire_le non nul, invisible au
 * public par RLS, d'où une lecture serveur en service_role limitée à ces
 * 3 colonnes). null si la fiche n'existe pas ou n'est pas retirée → 404.
 */
async function retiredVendorRedirect(id: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  try {
    const { data } = await createAdminClient()
      .from("vendors")
      .select("city, category, retire_le")
      .eq("id", id)
      .maybeSingle();
    const row = data as { city: string | null; category: string | null; retire_le: string | null } | null;
    if (!row?.retire_le) return null;
    const geo = await vendorGeoLinks(row.city ?? "", row.category ?? "");
    return geo.moreHref ?? "/prestataires";
  } catch {
    // Clé service_role absente (préproduction, local) : simple 404.
    return null;
  }
}

/** Critères d'indexation (description ≥ 80 mots + photo du prestataire). */
async function vendorIsIndexable(vendor: Awaited<ReturnType<typeof getVendor>> & object) {
  const signals = vendor.userId ? (await getVendorProfileSignals([vendor.userId])).get(vendor.userId) : undefined;
  return isVendorProfileIndexable({ ...vendor, about: vendor.about, photoCount: signals?.photoCount ?? 0 });
}

/** Le visiteur est-il le propriétaire de la fiche ou un admin ? */
async function canPreview(ownerId: string | null): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  if (ownerId && user.id === ownerId) return true;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return (data as { role?: string } | null)?.role === "admin";
}
