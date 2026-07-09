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
} from "@/lib/vendors";
import { getPackages } from "@/components/explorer/profileData";
import { getCurrentEvent } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const vendor = await getVendor(params.id);
  if (!vendor) return { title: "Prestataire — Misstice" };
  return {
    title: `${vendor.name} — ${vendor.category} à ${vendor.city} · Misstice`,
    description: vendor.tagline,
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
  const [realPackages, photos, reviews, stats, currentEvent] = await Promise.all([
    vendor.userId ? getPublicPackages(vendor.userId) : Promise.resolve([]),
    vendor.userId ? getPublicPhotos(vendor.userId) : Promise.resolve([]),
    getVendorReviews(vendor.id),
    getReviewStats(vendor.id),
    getCurrentEvent(),
  ]);
  const packages = realPackages.length ? realPackages : getPackages(vendor);

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

  return (
    <>
      <Header />
      <main>
        <VendorProfile
          vendor={vendorWithRating}
          packages={packages}
          reviews={reviews}
          breakdown={stats.breakdown}
          photos={photos}
          prefill={prefill}
          autoDevis={searchParams?.devis === "1"}
        />
      </main>
      <Footer />
    </>
  );
}
