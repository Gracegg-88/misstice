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
      heroAlt="Amis célébrant un anniversaire autour d'un gâteau"
      title="Comment organiser un anniversaire en 2026"
      subtitle="Guide pour organiser un anniversaire réussi, petit comité ou grande fête : budget moyen, checklist et prestataires vérifiés."
      eventLabel="un anniversaire"
      eventLabelGenitive="d'un anniversaire"
    />
  );
}
