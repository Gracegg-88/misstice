import type { Metadata } from "next";
import Link from "next/link";
import { Scale, ShieldCheck, Star, Lock, CircleUserRound } from "lucide-react";
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
    text: "Tous les avis publiés, positifs comme négatifs, restent visibles, jamais supprimés en cas de désaccord avec un prestataire.",
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

          {/* Notre démarche — avatar générique en attendant une vraie photo,
              volontairement pas de photo réelle pour l'instant. */}
          <div className="mt-10 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <div className="flex shrink-0 flex-col items-center gap-2 sm:w-40">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-premium text-cream shadow-lg shadow-violet/20">
                  <CircleUserRound size={38} strokeWidth={1.5} />
                </span>
                <p className="text-sm font-semibold text-plum">Grâce</p>
                <p className="text-xs text-slate">Fondatrice de Misstice</p>
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-plum">
                  Notre démarche
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  J&apos;ai créé Misstice parce que j&apos;en avais marre de
                  voir des amis galérer à organiser leur mariage ou leur
                  anniv entre 15 tableurs Excel, des messages perdus dans 5
                  conversations différentes, et des annuaires prestataires
                  où on ne sait jamais qui est vraiment sérieux derrière le
                  profil.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate">
                  Je suis Grâce, fondatrice de Misstice. Pas une grosse
                  boîte, pas un call center, juste moi, qui construis ce
                  que j&apos;aurais voulu avoir en organisant mes propres
                  événements. C&apos;est pour ça que la vérification des
                  prestataires, la transparence des avis et la protection
                  de vos coordonnées ne sont pas des arguments marketing
                  pour moi : c&apos;est la base de ce que je veux que
                  Misstice soit, dès le premier jour.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {points.map((p) => (
              <div
                key={p.title}
                className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D9B88C]/25 text-[#7A5C33]">
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
              className="font-semibold text-[#7A5C33] hover:text-[#5F4726]"
            >
              Découvrez comment les prestataires sont vérifiés avant
              publication
            </Link>
            , ou consultez notre{" "}
            <Link
              href="/#faq"
              className="font-semibold text-[#7A5C33] hover:text-[#5F4726]"
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
