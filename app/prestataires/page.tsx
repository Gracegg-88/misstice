import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExplorerClient from "@/components/explorer/ExplorerClient";
import { getVendors } from "@/lib/vendors";
import { getHeaderAccount } from "@/lib/header-account";

export const metadata: Metadata = {
  title: "Explorer les prestataires — Misstice",
  description:
    "Comparez photographes, traiteurs, DJ, salles et wedding planners. Classement au mérite, avis vérifiés, prix affichés. Filtrez par ville, budget et note.",
};

export default async function PrestatairesPage() {
  const vendors = await getVendors();
  // Catégories dérivées des fiches réelles → chaque filtre correspond toujours
  // à des résultats (pas de désalignement avec une taxonomie séparée).
  const categories = Array.from(new Set(vendors.map((v) => v.category))).sort(
    (a, b) => a.localeCompare(b, "fr")
  );
  const account = await getHeaderAccount();
  return (
    <>
      <Header initialAccount={account} />
      <main className="min-h-screen bg-cream">
        <ExplorerClient vendors={vendors} categories={categories} />
      </main>
      <Footer />
    </>
  );
}
