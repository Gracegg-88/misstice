import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VendorProfile from "@/components/explorer/VendorProfile";
import {
  getVendor,
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
  if (!vendor) return { title: "Prestataire · Misstice" };
  return {
    title: `${vendor.name} · ${vendor.category} à ${vendor.city} · Misstice`,
    description: vendor.tagline,
    alternates: { canonical: `/prestataires/${vendor.id}` },
    openGraph: {
      title: `${vendor.name} · ${vendor.category} à ${vendor.city} · Misstice`,
      description: vendor.tagline ?? `Découvrez ${vendor.name} sur Misstice, prestataire vérifié pour votre événement.`,
      type: "profile",
    },
    twitter: {
      card: "summary_large_image",
      title: `${vendor.name} · ${vendor.category} à ${vendor.city}`,
      description: vendor.tagline ?? `Prestataire vérifié sur Misstice.`,
    },
  };
}

export default async function VendorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { devis?: string };
}) {
  const vendor = await getVendor(params.id);
  if (!vendor) notFound();

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

  return (
    <>
      <Header />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
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
      </main>
      <Footer />
    </>
  );
}
