import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExplorerClient from "@/components/explorer/ExplorerClient";
import { getVendors } from "@/lib/vendors";
import { getHeaderAccount } from "@/lib/header-account";
import { getCities } from "@/lib/geo";

export const metadata: Metadata = {
  title: "Explorer les prestataires · Misstice",
  description:
    "Comparez photographes, traiteurs, DJ, salles et wedding planners. Classement au mérite, avis vérifiés, prix affichés. Filtrez par ville, budget et note.",
  alternates: { canonical: "/prestataires" },
};

export default async function PrestatairesPage() {
  const vendors = await getVendors();
  // Catégories dérivées des fiches réelles → chaque filtre correspond toujours
  // à des résultats (pas de désalignement avec une taxonomie séparée).
  const categories = Array.from(new Set(vendors.map((v) => v.category))).sort(
    (a, b) => a.localeCompare(b, "fr")
  );
  const [account, cities] = await Promise.all([getHeaderAccount(), getCities()]);
  return (
    <>
      <Header initialAccount={account} />
      <main className="min-h-screen bg-cream">
        <ExplorerClient vendors={vendors} categories={categories} />

        {cities.length > 0 && (
          <section className="mx-auto max-w-content px-4 pb-16 sm:px-8">
            <p className="text-sm font-semibold text-plum">Parcourir par ville</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {cities.map((c) => (
                <a
                  key={c.slug}
                  href={`/prestataires/ville/${c.slug}`}
                  className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-plum transition-colors hover:border-violet/30 hover:text-violet"
                >
                  {c.name}
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
