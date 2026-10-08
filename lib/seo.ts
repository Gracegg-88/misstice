import type { Metadata } from "next";

// Domaine canonique unique : toujours en www. misstice.com (sans www) est
// redirigé vers www au niveau du domaine Vercel (Settings → Domains), le
// code ne doit donc jamais produire d'URL sans www.
export const SITE_URL = "https://www.misstice.com";
export const SITE_NAME = "Misstice";

const DEFAULT_IMAGES = [
  {
    url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663888016991/vgNTQhbrhLgknDqF.jpg",
    width: 1200,
    height: 630,
    alt: "Misstice — Organisez vos moments importants",
  },
];

/** « Titre de la page | Misstice » — la marque n'est ajoutée qu'une seule fois. */
export function brandTitle(title: string): string {
  return `${title} | ${SITE_NAME}`;
}

/**
 * Métadonnées complètes d'une page publique : <title>, meta description,
 * canonical absolue (via metadataBase), Open Graph et Twitter cohérents.
 *
 * `title` est le titre SANS la marque : elle est ajoutée ici (title.absolute
 * pour ne jamais repasser par le template du layout racine). Chaque page
 * doit appeler ce helper : Next.js remplace entièrement les objets
 * openGraph/twitter du parent dès qu'une page en déclare un, et en hérite
 * tels quels (balises de l'accueil) si elle n'en déclare pas.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noindex = false,
  images,
}: {
  title: string;
  description: string;
  /** Chemin absolu depuis la racine, ex. "/prestataires". */
  path: string;
  type?: "website" | "article" | "profile";
  /** noindex,follow : la page reste explorable mais n'est pas indexée. */
  noindex?: boolean;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
}): Metadata {
  const fullTitle = brandTitle(title);
  const ogImages = images?.length ? images : DEFAULT_IMAGES;
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      locale: "fr_FR",
      type,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImages.map((i) => i.url),
    },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}
