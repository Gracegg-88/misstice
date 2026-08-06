import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Lock, BadgeCheck, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Nous faire confiance | Misstice",
  description:
    "Vérification SIRET des prestataires, coordonnées protégées avant acceptation du devis, politique d'annulation claire : comment Misstice protège particuliers et prestataires.",
};

const points = [
  {
    icon: ShieldCheck,
    title: "Vérification réelle du SIRET",
    text: "Chaque prestataire souhaitant le badge « Vérifié par Misstice » passe par une vérification manuelle de son SIRET par notre équipe — pas une simple case à cocher à l'inscription.",
  },
  {
    icon: Lock,
    title: "Coordonnées protégées",
    text: "Email, téléphone et adresse restent masqués des deux côtés tant que le devis n'a pas été accepté par le client. Aucun contact direct n'est possible avant cet accord, pour éviter le démarchage et les faux leads.",
  },
  {
    icon: FileText,
    title: "Politique d'annulation claire",
    text: "Les conditions d'annulation et de remboursement sont fixées à l'avance et consultables à tout moment dans nos CGU — pas de mauvaise surprise le jour J.",
  },
  {
    icon: BadgeCheck,
    title: "Un badge qui veut dire quelque chose",
    text: "Le badge « Vérifié par Misstice » n'est attribué qu'après contrôle. Il peut être retiré en cas d'anomalie détectée a posteriori.",
  },
];

export default function ConfiancePage() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Nous faire confiance
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate">
            Misstice met en relation des familles et des prestataires
            événementiels. Voici, concrètement, ce qu&apos;on fait pour que
            cette mise en relation reste sûre des deux côtés.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {points.map((p) => (
              <div
                key={p.title}
                className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                  <p.icon size={20} strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-display text-lg font-semibold text-plum">
                  {p.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">
                  {p.text}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-sm text-slate">
            Pour le détail complet des conditions (annulation,
            responsabilité, données personnelles), consultez nos{" "}
            <Link
              href="/cgu"
              className="font-semibold text-violet hover:text-violet-dark"
            >
              Conditions Générales d&apos;Utilisation
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
