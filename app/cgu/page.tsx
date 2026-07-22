import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — Misstice",
  description:
    "Conditions Générales d'Utilisation de la plateforme événementielle Misstice.",
};

const sections = [
  {
    title: "1. Objet",
    body: "Misstice est une plateforme événementielle collaborative permettant aux particuliers d'organiser leurs événements et aux prestataires de proposer leurs services.",
  },
  {
    title: "2. Accès",
    body: "L'accès est gratuit. L'inscription est obligatoire pour accéder aux fonctionnalités.",
  },
  {
    title: "3. Comptes utilisateurs",
    body: "L'utilisateur est responsable de la confidentialité de ses identifiants. Misstice se réserve le droit de suspendre tout compte en cas d'abus.",
  },
  {
    title: "4. Utilisation",
    body: "Il est interdit d'utiliser Misstice à des fins illicites, de publier des contenus faux ou trompeurs, de contourner la plateforme pour les transactions.",
  },
  {
    title: "5. Prestataires",
    body: "Les prestataires s'engagent à fournir des informations exactes. La vérification du badge est manuelle par l'équipe Misstice. Tout prestataire réalisant plus de 3 prestations par mois via Misstice s'engage à disposer d'un statut légal adapté (auto-entrepreneur ou équivalent) conformément à la législation française en vigueur.",
  },
  {
    title: "6. Responsabilité",
    body: "Misstice est une plateforme de mise en relation. Elle n'est pas responsable des prestations effectuées entre particuliers et prestataires.",
  },
  {
    title: "7. Données personnelles",
    body: (
      <>
        Traitées conformément à notre politique de confidentialité disponible
        sur{" "}
        <a
          href="https://www.iubenda.com/privacy-policy/93417670"
          className="font-semibold text-violet hover:text-violet-dark"
        >
          iubenda.com/privacy-policy/93417670
        </a>
        .
      </>
    ),
  },
  {
    title: "8. Modification",
    body: "Misstice se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email.",
  },
  {
    title: "9. Droit applicable",
    body: "Les présentes CGU sont soumises au droit français. Tout litige sera soumis aux tribunaux compétents de Versailles.",
  },
];

export default function CguPage() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="mt-3 text-sm text-slate">Dernière mise à jour : 20 juillet 2026</p>

          <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 text-sm leading-relaxed text-slate">
            <p>
              <span className="font-semibold text-plum">Responsable :</span>{" "}
              Grâce Grié, 25 rue Maréchal Joffre, 78000 Versailles, France
            </p>
            <p className="mt-1">
              <span className="font-semibold text-plum">Contact :</span>{" "}
              <a
                href="mailto:contact@misstice.com"
                className="font-semibold text-violet hover:text-violet-dark"
              >
                contact@misstice.com
              </a>
            </p>
          </div>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-display text-xl font-semibold text-plum">
                  {section.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
