import type { Metadata } from "next";
import { DM_Serif_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import "./animations.css";
import GuideMascot from "@/components/GuideMascot";

// Titres éditoriaux
const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: "400",
});

// Corps de texte
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "700"],
});

// Repères, statuts et microcopies : une troisième voix discrète mais plus
// dynamique, réservée aux informations fonctionnelles.
const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-label",
  display: "swap",
  weight: ["400", "500"],
});

// SEO dès le jour 1 (principe 5)
export const metadata: Metadata = {
  metadataBase: new URL("https://www.misstice.com"),
  title: {
    default: "Misstice | Organisez votre événement et trouvez vos prestataires",
    template: "%s | Misstice",
  },
  description:
    "Budget, invités, checklist et prestataires vérifiés réunis sur une seule plateforme. Mariage, anniversaire, baptême, gala : organisez votre événement sans vous éparpiller.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Misstice | Organisez votre événement et trouvez vos prestataires",
    description:
      "Budget, invités, checklist et prestataires vérifiés réunis sur une seule plateforme. Mariage, anniversaire, baptême, gala : organisez votre événement sans vous éparpiller.",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Misstice | Organisez votre événement et trouvez vos prestataires",
    description: "Organisez votre événement, comparez des devis et échangez avec des prestataires vérifiés.",
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
    <html lang="fr" className={`${dmSerif.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body className="font-sans bg-cream text-plum antialiased">
        {children}
        <GuideMascot />
      </body>
    </html>
  );
}
