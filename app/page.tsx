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
        <BecomeVendorCallout
          headline="Traiteur, DJ, décorateur… vous connaissez les événements en famille ?"
          body="Misstice n'est pas réservé aux grandes agences événementielles. On construit une communauté de prestataires à taille humaine, qui comprennent les mariages, anniversaires et baptêmes organisés en petit comité."
          ctaLabel="Réserver un appel"
        />
        <EventTypes />
        <HowItWorks />
        <BecomeVendorCallout
          headline="Votre activité mérite d'être vue par les bonnes familles"
          body="Pas besoin d'être un grand nom de l'événementiel : si vous accompagnez des mariages, anniversaires ou baptêmes à taille humaine, vous avez votre place sur Misstice."
          ctaLabel="Discutons de votre activité"
        />
        {/* Affiche la grille de vrais prestataires dès qu'il y en a un ;
            sinon un bloc "arrive bientôt" — jamais de fiches fictives. */}
        <FeaturedVendors />
        <FAQ />
        <BecomeVendorCallout
          headline="Prêt·e à rejoindre la communauté des prestataires Misstice ?"
          body="30 minutes suffisent pour qu'on comprenne votre activité et qu'on voie ensemble si Misstice a du sens pour vous."
          ctaLabel="Réserver un appel"
        />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
