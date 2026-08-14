import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventTypes from "@/components/EventTypes";
import HowItWorks from "@/components/HowItWorks";
import FeaturedVendors from "@/components/FeaturedVendors";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import BecomeVendorCallout from "@/components/BecomeVendorCallout";
import Footer from "@/components/Footer";
import { getHeaderAccount } from "@/lib/header-account";

export default async function Home() {
  const account = await getHeaderAccount();
  return (
    <>
      <Header initialAccount={account} />
      <main>
        <Hero />
        <EventTypes />
        <HowItWorks />
        <BecomeVendorCallout
          headline="Votre activité mérite d'être vue par les bonnes familles"
          body="Pas besoin d'être un grand nom de l'événementiel : si vous accompagnez des mariages, anniversaires ou baptêmes à taille humaine, vous avez votre place sur Misstice."
          signupHref="/creer?type=pro"
          ctaLabel="Discutons de votre activité"
        />
        {/* Affiche la grille de vrais prestataires dès qu'il y en a un ;
            sinon un bloc "arrive bientôt" — jamais de fiches fictives. */}
        <FeaturedVendors />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
