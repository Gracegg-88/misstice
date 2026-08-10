type Crumb = { label: string; href?: string };

/** Fil d'Ariane + BreadcrumbList (schema.org) pour les pages géolocalisées. */
export default function Breadcrumb({ items }: { items: Crumb[] }) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(site && item.href ? { item: `${site}${item.href}` } : {}),
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
