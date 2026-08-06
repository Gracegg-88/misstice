import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ShieldCheck, Star, Lock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Prestataires vérifiés et avis authentiques | Confiance Misstice",
  description:
    "Découvrez comment Misstice vérifie chaque prestataire (SIRET), garantit des avis authentiques et ne biaise jamais son classement par un système payant. La confiance, expliquée simplement.",
};

const points = [
  {
    icon: Scale,
    title: "Un classement qui n'est jamais à vendre",
    text: "Contrairement à certains annuaires événementiels, un prestataire ne peut pas payer pour apparaître en premier sur Misstice. Le classement reflète la pertinence pour votre recherche, pas un budget publicitaire.",
  },
  {
    icon: ShieldCheck,
    title: "Des prestataires vérifiés, pas juste inscrits",
    text: "Le badge « Vérifié par Misstice » atteste d'un contrôle réel du SIRET, recontrôlé automatiquement tous les 6 mois. Une inscription libre sans vérification, ce n'est pas notre modèle.",
  },
  {
    icon: Star,
    title: "Des avis qu'on ne peut pas trafiquer",
    text: "Tous les avis publiés, positifs comme négatifs, restent visibles — jamais supprimés en cas de désaccord avec un prestataire.",
  },
  {
    icon: Lock,
    title: "Vos coordonnées, protégées jusqu'à votre accord",
    text: "Un prestataire ne voit vos coordonnées qu'après que vous ayez accepté son devis. Zéro démarchage non sollicité, zéro spam.",
  },
];

export default function ConfiancePage() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Pourquoi faire confiance à Misstice
          </h1>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {points.map((p) => (
              <div
                key={p.title}
                className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                  <p.icon size={20} strokeWidth={1.75} />
                </span>
                <h2 className="mt-4 font-display text-lg font-semibold text-plum">
                  {p.title}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">
                  {p.text}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-10 max-w-2xl text-sm leading-relaxed text-slate">
            <Link
              href="/devenir-prestataire"
              className="font-semibold text-violet hover:text-violet-dark"
            >
              Découvrez comment les prestataires sont vérifiés avant
              publication
            </Link>
            , ou consultez notre{" "}
            <Link
              href="/#faq"
              className="font-semibold text-violet hover:text-violet-dark"
            >
              foire aux questions
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
