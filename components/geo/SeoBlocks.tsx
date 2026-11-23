import GuideFaq from "@/components/guide/GuideFaq";

/**
 * Blocs serveur partagés par les pages géolocalisées : rendus dans le HTML
 * initial (pas de chargement côté navigateur), donc lisibles par Google.
 */

export type FaqEntry = { q: string; a: string };

/** FAQ visible + données structurées FAQPage correspondantes. */
export function FaqSection({ title = "Questions fréquentes", items }: { title?: string; items: FaqEntry[] }) {
  if (!items.length) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section id="faq" className="mt-12 scroll-mt-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h2 className="font-display text-2xl font-semibold tracking-tight text-plum">{title}</h2>
      <div className="mt-4">
        <GuideFaq items={items} />
      </div>
    </section>
  );
}

/** Groupe de liens internes (pastilles) avec un titre. Rien si la liste est vide. */
export function LinkGroup({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  if (!links.length) return null;
  return (
    <div className="mt-8">
      <h2 className="text-sm font-semibold text-plum">{title}</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
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
    </div>
  );
}

/** Données structurées ItemList (liste de prestataires d'une page annuaire). */
export function ItemListSchema({ name, items }: { name: string; items: { url: string; name: string }[] }) {
  if (!items.length) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, url: it.url, name: it.name })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
