import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import "./animations.css";

// Titres éditoriaux
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Corps de texte
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "700"],
});

// SEO dès le jour 1 (principe 5)
export const metadata: Metadata = {
  title: "Misstice Organisez vos plus beaux événements",
  description:
    "Planifiez mariages, anniversaires, baptêmes et galas en un seul endroit : budget, checklist, invités et les meilleurs prestataires. Pour les familles, pensé pour la fête.",
  openGraph: {
    title: "Misstice Organisez vos plus beaux événements",
    description:
      "Budget, checklist, invités et prestataires vérifiés, réunis sur une seule plateforme.",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-cream text-plum antialiased">
        {children}
      </body>
    </html>
  );
}
