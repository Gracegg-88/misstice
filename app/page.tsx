/**
 * Carnet de Confiance — accueil public compact.
 * Les fonctionnalités vivent dans leurs routes existantes; la page guide vers elles au lieu de les répliquer.
 */
import type { Metadata } from "next";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HomeDirectory from "@/components/HomeDirectory";
import FeaturedVendors from "@/components/FeaturedVendors";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import { getHeaderAccount } from "@/lib/header-account";

export const metadata: Metadata = {
  title: "Organisez vos moments importants avec des prestataires vérifiés",
  description: "Misstice réunit votre projet, vos proches et des prestataires vérifiés pour comparer des devis, protéger vos coordonnées et organiser sans vous éparpiller.",
  alternates: { canonical: "/" },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Misstice",
  url: "https://www.misstice.com",
  inLanguage: "fr-FR",
  description: "Plateforme d’organisation d’événements et de mise en relation avec des prestataires vérifiés.",
};

export default async function Home() {
  const account = await getHeaderAccount();
  return (
    <>
      <Header initialAccount={account} />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <Hero />
        <HomeDirectory />
        <FeaturedVendors />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
