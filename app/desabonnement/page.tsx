import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Désabonnement · Misstice",
  robots: { index: false, follow: false },
};

// Page de confirmation du désabonnement des rappels d'inscription
// prestataire. Le désabonnement n'a lieu qu'au clic sur le bouton (POST),
// jamais à la simple ouverture du lien.
export default function DesabonnementPage({
  searchParams,
}: {
  searchParams: { id?: string; t?: string; ok?: string; erreur?: string };
}) {
  const { id, t, ok, erreur } = searchParams;
  const action =
    id && t
      ? `/api/unsubscribe/onboarding?id=${encodeURIComponent(id)}&t=${encodeURIComponent(t)}`
      : null;

  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-xl px-page py-20 text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-plum">
            Désabonnement
          </h1>

          {ok ? (
            <p className="mt-6 text-sm leading-relaxed text-slate">
              C&apos;est noté : vous ne recevrez plus de rappels concernant la
              finalisation de votre inscription prestataire.
            </p>
          ) : erreur || !action ? (
            <p className="mt-6 text-sm leading-relaxed text-slate">
              Ce lien de désabonnement est invalide ou incomplet. Écrivez-nous à{" "}
              <a
                href="mailto:contact@misstice.com"
                className="font-semibold text-violet hover:text-violet-dark"
              >
                contact@misstice.com
              </a>{" "}
              et nous vous désabonnerons.
            </p>
          ) : (
            <>
              <p className="mt-6 text-sm leading-relaxed text-slate">
                Vous ne souhaitez plus recevoir les rappels concernant la
                finalisation de votre inscription prestataire sur Misstice ?
              </p>
              <form method="post" action={action} className="mt-8">
                <button
                  type="submit"
                  className="rounded-xl bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-violet-dark"
                >
                  Me désabonner
                </button>
              </form>
            </>
          )}

          <p className="mt-10 text-sm">
            <Link href="/" className="font-semibold text-violet hover:text-violet-dark">
              Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
