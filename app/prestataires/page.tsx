import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExplorerClient from "@/components/explorer/ExplorerClient";
import { getVendors } from "@/lib/vendors";
import { getHeaderAccount } from "@/lib/header-account";
import { getAllPicksByCombo, getCities, getKnownCategorySlugs } from "@/lib/geo";

export const metadata: Metadata = pageMetadata({
  title: "Explorer les prestataires événementiels",
  description:
    "Comparez photographes, traiteurs, DJ, salles et wedding planners. Classement au mérite, avis vérifiés, prix affichés. Filtrez par ville, budget et note.",
  path: "/prestataires",
});

export default async function PrestatairesPage({
  searchParams,
}: {
  searchParams?: { page?: string | string[] };
}) {
  // ?page=N : lien partageable vers une page précise des résultats.
  const pageParam = Number.parseInt(String(searchParams?.page ?? "1"), 10);
  const initialPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const vendors = await getVendors();
  const [account, cities, knownCategories, picksByCombo] = await Promise.all([
    getHeaderAccount(),
    getCities(),
    getKnownCategorySlugs(),
    getAllPicksByCombo(),
  ]);
  // Catégories : celles déjà présentes dans l'annuaire + toute la taxonomie
  // connue (vendor_categories), pour que "Traiteur à Bordeaux" reste
  // sélectionnable même sans encore un seul prestataire inscrit dessus —
  // sinon le filtre lui-même serait vide et la sélection Top 10 (ci-dessous)
  // inatteignable depuis la recherche.
  const categories = Array.from(
    new Set([...vendors.map((v) => v.category), ...knownCategories.values()])
  ).sort((a, b) => a.localeCompare(b, "fr"));
  return (
    <>
      <Header initialAccount={account} />
      <main className="min-h-screen bg-cream">
        <ExplorerClient
          vendors={vendors}
          categories={categories}
          allCities={cities.map((c) => c.name)}
          picksByCombo={picksByCombo}
          initialPage={initialPage}
        />

        {cities.length > 0 && (
          <section className="mx-auto max-w-content px-page pb-16">
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
