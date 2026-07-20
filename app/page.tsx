import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventTypes from "@/components/EventTypes";
import HowItWorks from "@/components/HowItWorks";
import FeaturedVendors from "@/components/FeaturedVendors";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/FinalCTA";
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
        <FeaturedVendors />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
