import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Breadcrumb from "@/components/geo/Breadcrumb";
import { FaqSection, LinkGroup } from "@/components/geo/SeoBlocks";
import { pageMetadata } from "@/lib/seo";
import { getCities, getEventTypes } from "@/lib/geo";
import { eventGrammar, paragraphs } from "@/lib/city-content";
import { getRegionContentFile, isRegionIndexable, regionSlug } from "@/lib/region-content";
import { getIndexableCityHubs, getIndexableEventCityPages } from "@/lib/seo-rules";

export const revalidate = 86400;

/** Régions présentes dans la table des villes (cities.region). */
async function getRegions(): Promise<{ slug: string; name: string }[]> {
  const cities = await getCities();
  const seen = new Map<string, string>();
  for (const c of cities) if (c.region) seen.set(regionSlug(c.region), c.region);
  return Array.from(seen.entries()).map(([slug, name]) => ({ slug, name }));
}

export async function generateStaticParams() {
  return (await getRegions()).map((r) => ({ region: r.slug }));
}

export async function generateMetadata({ params }: { params: { region: string } }): Promise<Metadata> {
  const region = (await getRegions()).find((r) => r.slug === params.region);
  if (!region) return { title: "Région" };
  const content = getRegionContentFile(region.slug);
  return pageMetadata({
    title: `Organiser son événement en ${region.name} : villes, traditions et prestataires`,
    description: `Guide régional ${region.name} : traditions, lieux de réception, saison, spécialités et prestataires des principales villes de la région sur Misstice.`,
    path: `/region/${region.slug}`,
    // Indexée UNIQUEMENT quand un texte rédigé est publié (lib/region-content.ts).
    noindex: !isRegionIndexable(content),
  });
}

const SECTIONS: { key: keyof NonNullable<ReturnType<typeof getRegionContentFile>>; title: string }[] = [
  { key: "traditions_et_coutumes", title: "Traditions et coutumes" },
  { key: "lieux_de_reception_typiques", title: "Lieux de réception typiques" },
  { key: "meilleure_saison", title: "La meilleure saison" },
  { key: "specialites_culinaires", title: "Spécialités culinaires" },
  { key: "budget_moyen", title: "Budget moyen" },
];

export default async function RegionPage({ params }: { params: { region: string } }) {
  const region = (await getRegions()).find((r) => r.slug === params.region);
  if (!region) notFound();
  const content = getRegionContentFile(region.slug);

  const [cities, hubs, eventPages, eventTypes] = await Promise.all([
    getCities(),
    getIndexableCityHubs(),
    getIndexableEventCityPages(),
    getEventTypes(),
  ]);
  const regionCities = cities.filter((c) => c.region && regionSlug(c.region) === region.slug);
  const citySlugs = new Set(regionCities.map((c) => c.slug));
  // Liens vers les seules pages ville indexables de la région.
  const hubLinks = hubs
    .filter((h) => citySlugs.has(h.city.slug))
    .map((h) => ({ href: h.path, label: `Prestataires à ${h.city.name} (${h.listedCount})` }));
  const guideLinks = eventPages
    .filter((p) => citySlugs.has(p.city.slug))
    .map((p) => {
      const et = eventTypes.find((e) => e.slug === p.eventTypeSlug);
      return { href: p.path, label: `Organiser ${et ? eventGrammar(et).withArticle : p.eventTypeSlug} à ${p.city.name}` };
    });
  const intro = paragraphs(content?.introduction);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <section className="mx-auto max-w-content px-page py-12">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: region.name }]} />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">Guide régional</p>
          <h1 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Organiser son événement en {region.name}
          </h1>
          {intro.length > 0 ? (
            intro.map((p, i) => (
              <p key={i} className="mt-3 max-w-3xl leading-relaxed text-slate">
                {p}
              </p>
            ))
          ) : (
            <p className="mt-3 max-w-3xl leading-relaxed text-slate">
              Retrouvez les prestataires et les guides des villes de la région {region.name} référencées sur Misstice.
            </p>
          )}

          {content &&
            SECTIONS.map(({ key, title }) => {
              const text = content[key];
              if (typeof text !== "string" || !text.trim()) return null;
              return (
                <section key={key} className="mt-12">
                  <h2 className="font-display text-2xl font-semibold tracking-tight text-plum">{title}</h2>
                  {paragraphs(text).map((p, i) => (
                    <p key={i} className="mt-3 max-w-3xl leading-relaxed text-slate">
                      {p}
                    </p>
                  ))}
                </section>
              );
            })}

          <LinkGroup title={`Guides des villes de la région ${region.name}`} links={guideLinks} />
          <LinkGroup title={`Prestataires par ville en ${region.name}`} links={hubLinks} />

          <FaqSection items={(content?.faq ?? []).map((f) => ({ q: f.question, a: f.reponse }))} />

          {content?.sources && content.sources.length > 0 && (
            <div className="mt-12 border-t border-black/5 pt-6 text-xs leading-relaxed text-slate">
              {content.derniere_mise_a_jour && <p>Dernière mise à jour : {content.derniere_mise_a_jour}</p>}
              <p className="mt-2 font-semibold text-plum">Sources consultées</p>
              <ul className="mt-1 space-y-1">
                {content.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="underline hover:text-violet">
                      {s.titre?.trim() || s.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
