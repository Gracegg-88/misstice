import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Retrouvez les réponses aux questions les plus fréquentes sur l’organisation d’un événement et la mise en relation avec les prestataires Misstice.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return <><Header /><main className="min-h-[70vh] bg-cream px-5 pb-16 pt-12 sm:px-8 sm:pt-16"><div className="mx-auto max-w-content"><p className="font-label text-[10px] uppercase tracking-[0.16em] text-violet">Des réponses claires, sans détour</p><h1 className="mt-4 max-w-[13ch] font-display text-4xl font-semibold leading-[.92] text-plum sm:text-5xl">Questions fréquentes</h1><p className="mt-5 max-w-xl text-base font-light leading-relaxed text-slate">Tout ce qu’il faut comprendre avant de créer votre événement, demander un devis ou inviter vos proches.</p></div><FAQ /></main><Footer /></>;
}
