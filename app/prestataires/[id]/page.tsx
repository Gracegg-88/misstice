import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VendorProfile from "@/components/explorer/VendorProfile";
import { VENDORS } from "@/components/explorer/vendors";
import {
  getPackages,
  getReviews,
  ratingBreakdown,
} from "@/components/explorer/profileData";

export function generateStaticParams() {
  return VENDORS.map((v) => ({ id: String(v.id) }));
}

export function generateMetadata({
  params,
}: {
  params: { id: string };
}): Metadata {
  const vendor = VENDORS.find((v) => String(v.id) === params.id);
  if (!vendor) return { title: "Prestataire — Misstice" };
  return {
    title: `${vendor.name} — ${vendor.category} à ${vendor.city} · Misstice`,
    description: vendor.tagline,
  };
}

export default function VendorPage({ params }: { params: { id: string } }) {
  const vendor = VENDORS.find((v) => String(v.id) === params.id);
  if (!vendor) notFound();

  return (
    <>
      <Header />
      <main>
        <VendorProfile
          vendor={vendor}
          packages={getPackages(vendor)}
          reviews={getReviews(vendor)}
          breakdown={ratingBreakdown(vendor)}
        />
      </main>
      <Footer />
    </>
  );
}
