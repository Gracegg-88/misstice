"use client";

import VendorCard from "@/components/explorer/VendorCard";
import type { Vendor } from "@/components/explorer/vendors";
import { useFavorites } from "@/lib/useFavorites";

// Grille de la page d'accueil : réutilise la carte EXACTE de l'annuaire.
export default function FeaturedVendorsGrid({ vendors }: { vendors: Vendor[] }) {
  const { ids: saved, toggle } = useFavorites();

  return (
    <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {vendors.map((v) => (
        <VendorCard
          key={v.id}
          vendor={v}
          saved={saved.includes(v.id)}
          onToggleSave={toggle}
        />
      ))}
    </div>
  );
}
