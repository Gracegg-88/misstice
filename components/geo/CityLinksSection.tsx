import { getEventTypes } from "@/lib/geo";
import { eventGrammar } from "@/lib/city-content";
import { getIndexableCityHubs, getIndexableEventCityPages } from "@/lib/seo-rules";

/**
 * Maillage interne vers les pages ville (rendu serveur). Ne liste que des
 * pages indexables (lib/seo-rules.ts) : c'est le levier principal contre
 * « Détectée, actuellement non indexée » — Google explore en priorité les
 * pages qui reçoivent des liens depuis les pages importantes du site.
 *
 * - eventTypeSlug donné (guides /organiser-…) : d'abord les guides locaux
 *   de cet événement, puis les annuaires des villes principales.
 * - sans eventTypeSlug (accueil) : les annuaires des villes.
 */
export default async function CityLinksSection({
  eventTypeSlug,
  title,
  intro,
  max = 12,
}: {
  eventTypeSlug?: string;
  title: string;
  intro?: string;
  max?: number;
}) {
  const [hubs, eventPages, eventTypes] = await Promise.all([
    getIndexableCityHubs(),
    getIndexableEventCityPages(),
    getEventTypes(),
  ]);
  const et = eventTypes.find((e) => e.slug === eventTypeSlug);
  const guides = et
    ? eventPages
        .filter((p) => p.eventTypeSlug === et.slug)
        .map((p) => ({ href: p.path, label: `Organiser ${eventGrammar(et).withArticle} à ${p.city.name}` }))
    : [];
  const hubLinks = hubs.map((h) => ({ href: h.path, label: `Prestataires à ${h.city.name}` }));
  const links = [...guides, ...hubLinks].slice(0, max);
  if (!links.length) return null;

  return (
    <section className="mx-auto max-w-content px-page py-10">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-plum">{title}</h2>
      {intro && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">{intro}</p>}
      <ul className="mt-5 flex flex-wrap gap-2">
        {links.map((l) => (
          <li key={l.href}>
            <a
              href={l.href}
              className="inline-block rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-plum transition-colors hover:border-violet/30 hover:text-violet"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
