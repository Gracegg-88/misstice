import type { Metadata } from "next";
import GuidePlaceholderPage from "@/components/guide/GuidePlaceholderPage";

export const metadata: Metadata = {
  title: "Comment organiser un anniversaire en 2026 : budget et checklist",
  description:
    "Guide pour organiser un anniversaire réussi, petit comité ou grande fête : budget moyen, checklist et prestataires vérifiés sur Misstice.",
};

export default function OrganiserUnAnniversairePage() {
  return (
    <GuidePlaceholderPage
      heroImage="/birthday-party.jpg"
      heroAlt="Ballons et décoration pour une fête d'anniversaire"
      title="Comment organiser un anniversaire en 2026"
      eventLabel="un anniversaire"
      eventLabelGenitive="d'un anniversaire"
    />
  );
}
