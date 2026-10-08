import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import "./globals.css";
import "./animations.css";
import GuideMascot from "@/components/GuideMascot";
import { SITE_URL } from "@/lib/seo";

// Deux voix seulement, centralisées dans --font-heading / --font-body
// (consommées par tailwind.config.ts et globals.css). Pour changer de duo
// (ex. Cormorant Garamond + Inter, Playfair Display + Manrope), il suffit
// de remplacer ces deux imports.

// Titres éditoriaux : police variable (graisses réelles 400–600 + axe optique),
// donc plus de faux gras comme avec DM Serif Display (graisse unique).
const headingFont = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

// Texte courant, menu, boutons, libellés
const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// SEO dès le jour 1 (principe 5)
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Misstice | Organisez votre événement et trouvez vos prestataires",
    template: "%s | Misstice",
  },
  description:
    "Budget, invités, checklist et prestataires vérifiés réunis sur une seule plateforme. Mariage, anniversaire, baptême, gala : organisez votre événement sans vous éparpiller.",
  // Pas de canonical ici : un canonical déclaré dans le layout racine est
  // hérité par toute page qui n'en déclare pas, et la ferait pointer vers
  // l'accueil. Chaque page publique déclare la sienne via pageMetadata()
  // (lib/seo.ts).
  openGraph: {
    title: "Misstice | Organisez votre événement et trouvez vos prestataires",
    description:
      "Budget, invités, checklist et prestataires vérifiés réunis sur une seule plateforme. Mariage, anniversaire, baptême, gala : organisez votre événement sans vous éparpiller.",
    locale: "fr_FR",
    type: "website",
    siteName: "Misstice",
    images: [
      { url: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663888016991/vgNTQhbrhLgknDqF.jpg", width: 1200, height: 630, alt: "Misstice — Organisez vos moments importants" },
      { url: "/brand/misstice-mark.png", width: 1920, height: 1920, alt: "Symbole M-papillon Misstice" },
    ],
  },
  // PNG direct plutôt qu'un SVG encapsulant une image (<image href="...png">) :
  // ce dernier s'affichait bien en ouvrant le fichier directement, mais pas
  // dans le rendu spécifique des favicons de la barre d'onglets — support
  // incohérent des navigateurs pour ce cas précis, confirmé même en
  // navigation privée (donc pas un souci de cache). Le PNG est le format le
  // plus universellement fiable pour une favicon.
  // "?v=" à incrémenter à chaque future modification du contenu de l'icône
  // (voir commentaire plus bas sur pourquoi Next.js ne le fait plus
  // automatiquement dès qu'un objet `icons` est fourni ici).
  icons: {
    icon: "/brand/misstice-mark.png?v=1",
    shortcut: "/brand/misstice-mark.png",
    apple: "/brand/misstice-mark.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "Misstice | Organisez votre événement et trouvez vos prestataires",
    description: "Organisez votre événement, comparez des devis et échangez avec des prestataires vérifiés.",
    images: [
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663888016991/vgNTQhbrhLgknDqF.jpg",
      "/brand/misstice-mark.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${headingFont.variable} ${bodyFont.variable}`}>
      <body className="font-sans bg-cream text-plum antialiased">
        {children}
        <GuideMascot />
      </body>
    </html>
  );
}
