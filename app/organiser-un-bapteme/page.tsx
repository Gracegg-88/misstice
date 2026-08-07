import type { Metadata } from "next";
import GuidePlaceholderPage from "@/components/guide/GuidePlaceholderPage";

export const metadata: Metadata = {
  title: "Comment organiser un baptême en 2026 : étapes et budget",
  description:
    "Guide pour organiser un baptême serein : cérémonie, réception, budget et prestataires vérifiés sur Misstice.",
};

export default function OrganiserUnBaptemePage() {
  return (
    <GuidePlaceholderPage
      heroImage="/bapteme.png"
      heroAlt="Décoration douce pour une cérémonie de baptême"
      title="Comment organiser un baptême en 2026"
      eventLabel="un baptême"
      eventLabelGenitive="d'un baptême"
    />
  );
}
