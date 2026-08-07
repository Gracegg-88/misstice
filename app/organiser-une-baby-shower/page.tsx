import type { Metadata } from "next";
import GuidePlaceholderPage from "@/components/guide/GuidePlaceholderPage";

export const metadata: Metadata = {
  title: "Comment organiser une baby shower en 2026 : budget et idées",
  description:
    "Guide pour organiser une baby shower réussie : budget, checklist et prestataires vérifiés sur Misstice.",
};

export default function OrganiserUneBabyShowerPage() {
  return (
    <GuidePlaceholderPage
      heroImage="/babyshower.png"
      heroAlt="Décoration douce pour une baby shower"
      title="Comment organiser une baby shower en 2026"
      eventLabel="une baby shower"
      eventLabelGenitive="d'une baby shower"
    />
  );
}
