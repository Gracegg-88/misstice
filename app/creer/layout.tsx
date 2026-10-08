import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Créer mon événement",
  description:
    "Créez gratuitement votre événement sur Misstice ou inscrivez-vous comme prestataire : budget, invités, checklist et prestataires vérifiés réunis au même endroit.",
  path: "/creer",
});

export default function CreerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
