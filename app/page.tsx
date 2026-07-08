import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventTypes from "@/components/EventTypes";
import HowItWorks from "@/components/HowItWorks";
import FeaturedVendors from "@/components/FeaturedVendors";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <EventTypes />
        <HowItWorks />
        <FeaturedVendors />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
