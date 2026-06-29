import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import HowItWorks from "@/components/HowItWorks";
import EventTypes from "@/components/EventTypes";
import FeaturedVendors from "@/components/FeaturedVendors";
import Testimonials from "@/components/Testimonials";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <EventTypes />
        <FeaturedVendors />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
