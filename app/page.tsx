import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Mentions Légales — Misstice",
  description: "Mentions légales de la plateforme événementielle Misstice.",
};

const sections = [
  {
    title: "1. Éditeur du site",
    body: (
      <>
        Nom : Grâce Grié
        <br />
        Adresse : 25 rue Maréchal Joffre, 78000 Versailles, France
        <br />
        Email :{" "}
        <a
          href="mailto:contact@misstice.com"
          className="font-semibold text-violet hover:text-violet-dark"
        >
          contact@misstice.com
        </a>
        <br />
        Site :{" "}
        <a
          href="https://www.misstice.com"
          className="font-semibold text-violet hover:text-violet-dark"
        >
          www.misstice.com
        </a>
      </>
    ),
  },
  {
    title: "2. Hébergement",
    body: (
      <>
        Vercel Inc.
        <br />
        440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
        <br />
        <a
          href="https://vercel.com"
          className="font-semibold text-violet hover:text-violet-dark"
        >
          https://vercel.com
        </a>
      </>
    ),
  },
  {
    title: "3. Propriété intellectuelle",
    body: "L'ensemble du contenu de ce site (textes, images, logo) est la propriété exclusive de Misstice. Toute reproduction est interdite sans autorisation préalable.",
  },
  {
    title: "4. Données personnelles",
    body: (
      <>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
        rectification et de suppression de vos données. Pour exercer ces
        droits :{" "}
        <a
          href="mailto:contact@misstice.com"
          className="font-semibold text-violet hover:text-violet-dark"
        >
          contact@misstice.com
        </a>
      </>
    ),
  },
  {
    title: "5. Cookies",
    body: (
      <>
        Ce site utilise des cookies. Pour en savoir plus, consultez notre{" "}
        <a
          href="https://www.iubenda.com/privacy-policy/93417670"
          className="font-semibold text-violet hover:text-violet-dark"
        >
          politique de confidentialité
        </a>
        .
      </>
    ),
  },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
            Mentions Légales
          </h1>

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
