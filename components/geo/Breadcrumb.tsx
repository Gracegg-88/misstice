import { SITE_URL } from "@/lib/seo";

type Crumb = { label: string; href?: string };

/**
 * Fil d'Ariane + BreadcrumbList (schema.org).
 * Chaque niveau porte son URL absolue en https://www (le dernier, la page
 * courante, peut s'en passer). Avant, ces URL dépendaient de la variable
 * NEXT_PUBLIC_SITE_URL : sans elle, aucun niveau n'avait d'URL et Google
 * n'en retenait aucun (0 fil d'Ariane détecté dans Search Console).
 */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: `${SITE_URL}${item.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate">
        {items.map((item, i) => (
          <span key={item.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <a href={item.href} className="hover:text-violet">
                {item.label}
              </a>
            ) : (
              <span className="text-plum">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
