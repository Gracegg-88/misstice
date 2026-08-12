import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer mon événement · Misstice",
  description:
    "Créez gratuitement votre événement sur Misstice ou inscrivez-vous comme prestataire : budget, invités, checklist et prestataires vérifiés réunis au même endroit.",
  alternates: { canonical: "/creer" },
  openGraph: {
    title: "Créer mon événement | Misstice",
    description: "Centralisez budget, invités, checklist et demandes de devis auprès de prestataires vérifiés.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Créer mon événement | Misstice",
    description: "Centralisez l’organisation de votre événement avec Misstice.",
  },
};

export default function CreerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
