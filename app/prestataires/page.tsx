import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ExplorerClient from "@/components/explorer/ExplorerClient";

export const metadata: Metadata = {
  title: "Explorer les prestataires — Misstice",
  description:
    "Comparez photographes, traiteurs, DJ, salles et wedding planners. Classement au mérite, avis vérifiés, prix affichés. Filtrez par ville, budget, note et langue.",
};

export default function PrestatairesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream">
        <ExplorerClient />
      </main>
      <Footer />
    </>
  );
}
