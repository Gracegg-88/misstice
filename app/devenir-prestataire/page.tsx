import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalendlyButton from "@/components/CalendlyButton";
import CircularCarousel from "@/components/CircularCarousel";
import { getPilotSlotsRemaining, getPlatformSettings } from "@/lib/pilot";

export const metadata: Metadata = pageMetadata({
  title: "Devenir prestataire mariage et événementiel : inscription gratuite",
  description:
    "Rejoignez Misstice, la plateforme qui connecte prestataires mariage et événementiel à des particuliers en France : mariage, anniversaire, baptême, gala, baby shower. Inscription gratuite, badge Vérifié.",
  path: "/devenir-prestataire",
});

const CTA_HREF = "/creer?type=pro";

const faqs = [
  {
    q: "Combien ça coûte de s'inscrire ?",
    a: "La création de votre page pro est entièrement gratuite, sans engagement. Le Pack Pro (options avancées) est optionnel.",
  },
  {
    q: "Comment fonctionne la commission ?",
    a: "Une commission de 15 % est prélevée uniquement sur les prestations effectivement réservées via Misstice, au moment du paiement.",
  },
  {
    q: "Quand suis-je payé ?",
    a: "Le client règle l'intégralité du devis dès son acceptation, en sécurité chez Misstice (séquestre Stripe). Votre part est versée automatiquement sur votre compte 72h après la date de l'événement, sauf signalement du client pendant ce délai. Pour les catégories nécessitant une rencontre préalable (Traiteur, Robe & Tenue, Coiffure & Maquillage), la réservation est confirmée après cette rencontre — et automatiquement si le client ne répond pas avant la date limite, pour que vous ne restiez jamais sans réponse.",
  },
  {
    q: "Puis-je demander un acompte à la réservation ?",
    a: "Oui. Depuis votre profil, choisissez un pourcentage d'acompte (jusqu'à 50 % de votre part), avec une valeur pré-remplie selon votre métier (par exemple 50 % pour un traiteur) — ajustable à tout moment, et modifiable aussi au cas par cas sur chaque devis.",
  },
  {
    q: "Puis-je m'inscrire pour plusieurs types d'événements à la fois ?",
    a: "Oui. Vous choisissez librement les types d'événements que vous couvrez (mariage, anniversaire, baptême, gala, baby shower…) et vous pouvez modifier cette liste à tout moment depuis votre profil.",
  },
];

export default async function DevenirPrestatairePage() {
  const [slotsRemaining, { pilotDurationMonths }] = await Promise.all([
    getPilotSlotsRemaining(),
    getPlatformSettings(),
  ]);

  return (
    <>
      <Header />
      <main className="bg-cream">
        {/* ── Bloc 1 : premier écran — titre + bouton, visuels en fond ── */}
        <section className="grain relative overflow-hidden bg-cream pb-10 pt-6 sm:pb-14 sm:pt-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-violet/20 blur-[90px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-gold/25 blur-[100px]"
          />
          <CircularCarousel variant="background" />

          <div className="relative mx-auto max-w-2xl px-5 text-center sm:px-8">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet/20 bg-white/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-violet backdrop-blur-sm">
              Espace prestataires · Phase pilote
            </span>
            <h1 className="mt-4 font-hero text-hero font-bold leading-[1.05] tracking-tight text-plum">
              Créez votre{" "}
              <span className="text-violet">page pro</span> en quelques
              minutes
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-slate sm:text-[17px]">
              Une seule page, personnalisable, à partager partout. Misstice
              connecte votre activité à des particuliers qui organisent
              mariages, anniversaires, baptêmes, galas et baby showers.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3">
              <Link
                href={CTA_HREF}
                className="inline-flex items-center justify-center rounded-full bg-ink px-8 py-4 text-base font-semibold text-cream shadow-lg shadow-ink/20 transition-transform hover:-translate-y-0.5"
              >
                Créer ma page gratuite
              </Link>
              <p className="text-xs text-slate">
                10 minutes · gratuit · sans engagement
              </p>
            </div>

            {/* Sous-navigation de la page (descend vers les sections). */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="#fonctionnalites"
                className="rounded-full border border-plum/15 bg-white/70 px-4 py-2 text-xs font-semibold text-plum backdrop-blur-sm transition-colors hover:bg-white"
              >
                Fonctionnalités
              </a>
              <CalendlyButton
                label="Réserver un appel plutôt"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate underline decoration-slate/30 underline-offset-4 hover:text-plum"
              />
            </div>
          </div>
        </section>

        {/* ── Bloc 2 : Fonctionnalités + Tarifs fusionnés — les cartes
             Gratuit / Pack Pro portent directement la liste complète de ce
             qui est inclus, pour ne pas répéter la même info deux fois. ── */}
        <section id="fonctionnalites" className="scroll-mt-24 bg-white py-14">
          <div className="mx-auto max-w-content px-page">
            <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
              Tout ce qu&apos;il te faut
            </h2>
            <div className="mx-auto mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
              <div className="rounded-3xl border border-black/5 bg-cream p-7">
                <p className="font-display text-lg font-semibold text-plum">Gratuit</p>
                <p className="mt-1 text-sm text-slate">Pour toujours</p>
                <p className="mt-4 font-display text-3xl font-semibold text-plum">0 €</p>
                <ul className="mt-5 space-y-2 text-sm text-slate">
                  <li>Page personnalisable</li>
                  <li>Agenda partagé</li>
                  <li>Devis en ligne</li>
                  <li>Carte de visite digitale</li>
                  <li>Signature professionnelle</li>
                </ul>
              </div>
              <div className="relative rounded-3xl border-2 border-violet bg-cream p-7">
                <span className="absolute -top-3 left-7 rounded-full bg-violet px-3 py-1 text-xs font-semibold text-white">
                  Recommandé
                </span>
                <p className="font-display text-lg font-semibold text-plum">Pack Pro</p>
                <p className="mt-1 text-sm text-slate">9 €/mois ou 79 €/an</p>
                <p className="mt-4 font-display text-3xl font-semibold text-plum">
                  9 €<span className="text-base font-medium text-slate">/mois</span>
                </p>
                <ul className="mt-5 space-y-2 text-sm text-slate">
                  <li>Page personnalisable</li>
                  <li>Agenda partagé</li>
                  <li>Lien et QR code dédié à partager</li>
                  <li>Devis en ligne</li>
                  <li>Carte de visite digitale</li>
                  <li>Signature professionnelle</li>
                  <li>Statistiques</li>
                  <li>Mise en avant</li>
                </ul>
                {slotsRemaining > 0 ? (
                  <p className="mt-5 rounded-xl bg-gold-soft px-3 py-2 text-center text-xs font-semibold text-gold-dark">
                    ✦ Offert {pilotDurationMonths} mois aux membres pilotes —
                    plus que {slotsRemaining} place
                    {slotsRemaining > 1 ? "s" : ""}
                  </p>
                ) : (
                  <p className="mt-5 rounded-xl bg-violet-soft px-3 py-2 text-center text-xs font-semibold text-violet">
                    Programme pilote complet
                  </p>
                )}
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-slate">
              Commission de 15 % uniquement sur les réservations payées via
              Misstice · Paiement sécurisé par séquestre · Versé
              automatiquement 72h après l&apos;événement.
            </p>
            <p className="mt-2 text-center text-sm text-slate">
              Détails complets dans nos{" "}
              <Link
                href="/cgu#annulation"
                className="font-semibold text-violet hover:text-violet-dark"
              >
                CGU (paiement, séquestre et litiges)
              </Link>
              .
            </p>
          </div>
        </section>

        {/* ── Bloc 3 : FAQ + CTA final, côte à côte sur ordinateur pour
             éviter un scroll en plus (ils s'empilent sur mobile). ── */}
        <section className="mx-auto max-w-content px-page py-14">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div>
              <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl lg:text-left">
                Foire aux questions
              </h2>
              <div className="mt-8 space-y-3">
                {faqs.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm [&_svg]:open:rotate-180"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-plum marker:hidden">
                      {f.q}
                      <ChevronDown
                        size={20}
                        className="shrink-0 text-violet transition-transform"
                      />
                    </summary>
                    <p className="mt-3 leading-relaxed text-slate">{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-6 text-center text-sm text-slate lg:text-left">
                D&apos;autres questions ? Consultez notre{" "}
                <Link
                  href="/faq"
                  className="font-semibold text-violet hover:text-violet-dark"
                >
                  foire aux questions complète
                </Link>
                .
              </p>
            </div>

            <div className="rounded-[32px] bg-gradient-premium p-8 text-center sm:p-12">
              <p className="font-display text-2xl font-semibold text-cream sm:text-3xl">
                Prêt à développer votre activité ?
              </p>
              <div className="mt-6">
                <Link
                  href={CTA_HREF}
                  className="inline-flex items-center justify-center rounded-full bg-cream px-8 py-4 text-base font-semibold text-violet shadow-lg transition-all hover:brightness-95"
                >
                  Créer mon profil prestataire
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
