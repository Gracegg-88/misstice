import type { Metadata } from "next";
import Link from "next/link";
import {
  Rocket,
  BadgeCheck,
  Percent,
  UserPlus,
  Inbox,
  MessageSquare,
  ShieldCheck,
  Lock,
  LayoutDashboard,
  ChevronDown,
  Clock,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalendlyButton from "@/components/CalendlyButton";

export const metadata: Metadata = {
  title: "Devenir prestataire mariage et événementiel sur Misstice | Inscription gratuite",
  description:
    "Rejoignez Misstice, la plateforme qui connecte prestataires mariage et événementiel à des particuliers en France : mariage, anniversaire, baptême, gala, baby shower. Inscription gratuite, badge Vérifié.",
  alternates: { canonical: "/devenir-prestataire" },
};

const CTA_HREF = "/creer?type=pro";

const perks = [
  {
    icon: Rocket,
    title: "Une visibilité maximale, dès maintenant",
    text: "Vous faites partie des tout premiers prestataires référencés, une visibilité maximale pendant la phase de lancement.",
  },
  {
    icon: BadgeCheck,
    title: "Un badge qui rassure",
    text: "Un badge « Vérifié par Misstice » qui rassure vos clients dès le premier contact (vérification SIRET).",
  },
  {
    icon: Percent,
    title: "Une commission claire",
    text: "15 % uniquement sur les prestations réalisées via la plateforme, pas d'abonnement mensuel, pas de frais cachés.",
  },
];

const steps = [
  {
    icon: UserPlus,
    label: "Étape 1",
    title: "Créez votre profil",
    text: "Indiquez les types d'événements que vous couvrez : 5 minutes, gratuit.",
  },
  {
    icon: Inbox,
    label: "Étape 2",
    title: "Recevez des demandes",
    text: "Des demandes de devis correspondant précisément à votre activité.",
  },
  {
    icon: MessageSquare,
    label: "Étape 3",
    title: "Échangez et concluez",
    text: "Répondez, échangez, et concluez directement via la plateforme.",
  },
  {
    icon: ShieldCheck,
    label: "Étape 4",
    title: "Soyez payé sereinement",
    text: "Paiement sécurisé par séquestre, versé automatiquement 72h après votre événement.",
  },
];

const payment = [
  {
    icon: Percent,
    title: "Une commission de 15 %",
    text: "Misstice prélève 15 % sur chaque prestation réservée via la plateforme. Pas d'abonnement, pas de frais caché : vous ne payez que lorsque vous décrochez une mission.",
  },
  {
    icon: Lock,
    title: "Paiement sécurisé par séquestre",
    text: "Dès que le client accepte votre devis, son paiement est immédiatement sécurisé par Misstice via Stripe. Vous n'avez rien à gérer côté paiement : tout est automatisé.",
  },
  {
    icon: Clock,
    title: "Versé automatiquement",
    text: "Votre part est versée automatiquement sur votre compte 72h après la date de l'événement, sauf signalement du client pendant ce délai.",
  },
];

const differentiators = [
  {
    icon: ShieldCheck,
    text: (
      <>
        <Link
          href="/confiance"
          className="font-semibold text-festif underline decoration-festif/40 underline-offset-2 hover:decoration-festif"
        >
          Vérification réelle de votre SIRET
        </Link>
        , pas juste une inscription libre.
      </>
    ),
  },
  {
    icon: Lock,
    text: "Vos coordonnées restent protégées tant que le client n'a pas accepté votre devis, zéro spam, zéro faux lead.",
  },
  {
    icon: LayoutDashboard,
    text: "Une seule interface pour gérer vos demandes, quel que soit le type d'événement.",
  },
];

const faqs = [
  {
    q: "Combien ça coûte de s'inscrire ?",
    a: "L'inscription et la création de votre profil sont entièrement gratuites, sans engagement.",
  },
  {
    q: "Comment fonctionne la commission ?",
    a: "Une commission de 15 % est prélevée uniquement sur les prestations effectivement réservées via Misstice, au moment du paiement. Aucun abonnement mensuel, aucun frais caché : vous ne payez que lorsque vous décrochez une mission.",
  },
  {
    q: "Quand suis-je payé ?",
    a: "Le client règle l'intégralité du devis dès son acceptation, en sécurité chez Misstice (séquestre Stripe). Votre part est versée automatiquement sur votre compte 72h après la date de l'événement, sauf signalement du client pendant ce délai.",
  },
  {
    q: "Puis-je m'inscrire pour plusieurs types d'événements à la fois ?",
    a: "Oui. Vous choisissez librement les types d'événements que vous couvrez (mariage, anniversaire, baptême, gala, baby shower…) et vous pouvez modifier cette liste à tout moment depuis votre profil.",
  },
  {
    q: "Puis-je refuser une demande ?",
    a: "Bien sûr. Vous restez libre d'accepter ou de refuser chaque demande de devis selon votre disponibilité et vos envies.",
  },
];

export default function DevenirPrestatairePage() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        {/* ── H1 + CTA, visible sans scroller ── */}
        <section className="bg-gradient-soft">
          <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-8 sm:py-20">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet/20 bg-white/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-violet">
              Espace prestataires
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-plum sm:text-4xl lg:text-5xl">
              Développez votre activité de prestataire mariage et
              événementiel avec Misstice
            </h1>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href={CTA_HREF}
                className="ev-cta ev-cta-pulse inline-flex items-center justify-center rounded-2xl px-8 py-4 text-base font-semibold text-cream shadow-lg shadow-violet/25"
              >
                Devenir prestataire pilote
              </Link>
              <CalendlyButton
                label="Réserver un appel plutôt"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-plum/20 bg-white/70 px-6 py-4 text-base font-semibold text-plum backdrop-blur-sm transition-colors hover:bg-white"
              />
            </div>
            <p className="mt-3 text-xs text-slate">
              30 minutes pour répondre à vos questions, sans engagement.
            </p>
          </div>
        </section>

        {/* ── Tous types d'événements ── */}
        <section className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
            Une plateforme pour tous vos événements, pas seulement les
            mariages
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate">
            Que vous soyez traiteur, photographe, DJ, décorateur ou
            fleuriste, Misstice vous connecte à des particuliers qui
            organisent mariages, anniversaires, baptêmes, galas ou baby
            showers. Votre activité n&apos;est pas limitée à un seul type
            d&apos;événement, votre visibilité non plus.
          </p>
        </section>

        {/* ── Pourquoi rejoindre maintenant ── */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-content px-5 sm:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
              Pourquoi rejoindre Misstice maintenant
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {perks.map((p) => (
                <div
                  key={p.title}
                  className="rounded-3xl border border-black/5 bg-cream p-6"
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
          </div>
        </section>

        {/* ── Comment ça marche ── */}
        <section className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
            Comment ça marche
          </h2>
          <div className="mt-9 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative">
                <div className="flex h-full flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet text-cream shadow-md shadow-violet/25">
                    <s.icon size={22} strokeWidth={1.75} />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-violet">
                    {s.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-plum">
                    {s.title}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate">
                    {s.text}
                  </p>
                </div>
                {/* Connecteur entre les étapes (desktop) */}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute right-[-14px] top-11 hidden h-px w-7 bg-violet/25 lg:block"
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate">
            Vous avez d&apos;autres questions ? Consultez notre{" "}
            <Link
              href="/#faq"
              className="font-semibold text-violet hover:text-violet-dark"
            >
              foire aux questions prestataires
            </Link>
            .
          </p>
        </section>

        {/* ── Comment fonctionne le paiement ── */}
        <section className="bg-white py-14">
          <div className="mx-auto max-w-content px-5 sm:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
              Comment fonctionne le paiement
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-slate">
              Simple et transparent : le client paie en ligne dès qu&apos;il
              accepte votre devis, Misstice sécurise le paiement, et vous êtes
              réglé automatiquement après l&apos;événement.
            </p>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {payment.map((p) => (
                <div
                  key={p.title}
                  className="rounded-3xl border border-black/5 bg-cream p-6"
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
            <p className="mt-6 text-sm text-slate">
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

        {/* ── Ce qui différencie Misstice ── */}
        <section className="bg-ink py-14">
          <div className="mx-auto max-w-content px-5 sm:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-cream sm:text-3xl">
              Ce qui différencie Misstice des autres plateformes
            </h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {differentiators.map((d, i) => (
                <div key={i} className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream/10 text-festif">
                    <d.icon size={19} strokeWidth={1.75} />
                  </span>
                  <p className="text-sm leading-relaxed text-cream/85">
                    {d.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ prestataires ── */}
        <section className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
              Foire aux questions prestataires
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
          </div>
        </section>

        {/* ── CTA final ── */}
        <section className="mx-auto max-w-content px-5 pb-16 sm:px-8">
          <div className="rounded-[32px] bg-gradient-premium p-8 text-center sm:p-12">
            <p className="font-display text-2xl font-semibold text-cream sm:text-3xl">
              Prêt à développer votre activité ?
            </p>
            <div className="mt-6">
              <Link
                href={CTA_HREF}
                className="inline-flex items-center justify-center rounded-2xl bg-cream px-8 py-4 text-base font-semibold text-violet shadow-lg transition-all hover:brightness-95"
              >
                Créer mon profil prestataire
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
