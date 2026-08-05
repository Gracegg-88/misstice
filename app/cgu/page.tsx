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
    title: "6. Annulation et remboursement",
    body: (
      <div id="annulation" className="scroll-mt-24 space-y-4">
        <div>
          <p className="font-semibold text-plum">1. Annulation par le client</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>Plus de 30 jours avant l&apos;événement : remboursement à 100 %.</li>
            <li>Entre 30 et 8 jours avant l&apos;événement : remboursement à 50 %.</li>
            <li>
              Moins de 8 jours avant l&apos;événement : aucun remboursement, sauf
              accord du prestataire.
            </li>
            <li>
              Les remboursements sont traités manuellement par l&apos;équipe
              Misstice sous 5 jours ouvrés.
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-plum">2. Annulation par le prestataire</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              Remboursement intégral du client (montant total, commission
              Misstice incluse).
            </li>
            <li>
              Le prestataire s&apos;expose à une suspension de compte en cas
              d&apos;annulations répétées.
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-plum">3. Litige / prestation non conforme</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              Le client dispose de 48h après l&apos;événement pour signaler un
              litige via{" "}
              <a
                href="mailto:contact@misstice.com"
                className="font-semibold text-violet hover:text-violet-dark"
              >
                contact@misstice.com
              </a>
              .
            </li>
            <li>
              Misstice agit en médiateur, sans garantie automatique de
              remboursement (étudié au cas par cas).
            </li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-plum">4. Commission Misstice</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            <li>
              La commission de 12 % n&apos;est pas remboursable en cas
              d&apos;annulation par le client (sauf cas de remboursement à 100 %
              ci-dessus).
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "7. Responsabilité",
    body: "Misstice est une plateforme de mise en relation. Elle n'est pas responsable des prestations effectuées entre particuliers et prestataires.",
  },
  {
    title: "8. Données personnelles",
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
    title: "9. Modification",
    body: "Misstice se réserve le droit de modifier les présentes CGU. Les utilisateurs seront informés par email.",
  },
  {
    title: "10. Droit applicable",
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
          <p className="mt-3 text-sm text-slate">Dernière mise à jour : 5 août 2026</p>

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
                <div className="mt-2 text-sm leading-relaxed text-slate">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
