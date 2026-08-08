import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer mon événement · Misstice",
  description:
    "Créez gratuitement votre événement sur Misstice ou inscrivez-vous comme prestataire : budget, invités, checklist et prestataires vérifiés réunis au même endroit.",
  alternates: { canonical: "/creer" },
};

export default function CreerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
