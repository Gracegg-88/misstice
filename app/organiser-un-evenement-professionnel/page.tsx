import type { Metadata } from "next";
import GuidePlaceholderPage from "@/components/guide/GuidePlaceholderPage";

export const metadata: Metadata = {
  title: "Comment organiser un événement professionnel en 2026",
  description:
    "Guide pour organiser un événement professionnel réussi : séminaire, gala ou soirée d'entreprise, budget et prestataires vérifiés sur Misstice.",
};

export default function OrganiserUnEvenementProfessionnelPage() {
  return (
    <GuidePlaceholderPage
      heroImage="/gala.png"
      heroAlt="Salle de réception préparée pour un événement professionnel"
      title="Comment organiser un événement professionnel en 2026"
      eventLabel="un événement professionnel"
      eventLabelGenitive="d'un événement professionnel"
    />
  );
}
