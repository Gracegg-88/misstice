import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, Users, Store, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Comment organiser votre événement | Guides Misstice",
  description:
    "Découvrez comment Misstice simplifie l'organisation de votre événement, puis consultez le guide dédié à votre projet : mariage, anniversaire, baptême, événement professionnel ou baby shower.",
};

const steps: {
  n: number;
  icon: LucideIcon;
  title: string;
  text: string;
}[] = [
  {
    n: 1,
    icon: CalendarPlus,
    title: "Créez votre événement",
    text: "Indiquez les informations essentielles et donnez vie à votre projet en quelques minutes.",
  },
  {
    n: 2,
    icon: Users,
    title: "Organisez budget, invités et tâches",
    text: "Gérez votre budget, suivez votre checklist et centralisez toutes les informations.",
  },
  {
    n: 3,
    icon: Store,
    title: "Réservez vos prestataires",
    text: "Trouvez les meilleurs prestataires, comparez et réservez en toute sérénité.",
  },
];

const guides = [
  {
    href: "/organiser-un-mariage",
    image: "/wedding-crowd.jpg",
    title: "Organiser un mariage",
    text: "Budget moyen, checklist mois par mois et conseils pour un mariage réussi, petit comité ou grand jour.",
  },
  {
    href: "/organiser-un-anniversaire",
    image: "/birthday-party.jpg",
    title: "Organiser un anniversaire",
    text: "De la petite fête entre proches à la grande soirée, tout pour organiser un anniversaire sans stress.",
  },
  {
    href: "/organiser-un-bapteme",
    image: "/bapteme-photo.png",
    title: "Organiser un baptême",
    text: "Cérémonie, réception et prestataires : le guide pour organiser un baptême serein du début à la fin.",
  },
  {
    href: "/organiser-un-evenement-professionnel",
    image: "/cowork.jpg",
    title: "Organiser un événement professionnel",
    text: "Séminaire, gala ou soirée d'entreprise : la méthode pour un événement professionnel maîtrisé.",
  },
  {
    href: "/organiser-une-baby-shower",
    image: "/babyshower-photo.png",
    title: "Organiser une baby shower",
    text: "Préparez l'arrivée de bébé avec une organisation simple, entre budget raisonnable et bons souvenirs.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-content px-5 py-14 sm:px-8">
          <Reveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
              En 3 étapes
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-plum sm:text-4xl">
              Comment ça marche&nbsp;?
            </h1>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 120} className="h-full">
                <div className="group flex h-full items-start gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-violet/20 hover:shadow-xl hover:shadow-violet/5">
                  <div className="relative shrink-0">
                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-soft text-violet">
                      <step.icon size={26} strokeWidth={1.75} />
                    </span>
                    <span className="absolute -left-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-violet font-display text-sm font-bold text-white shadow-md shadow-violet/30">
                      {step.n}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold leading-snug text-plum">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-slate">
                      {step.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-20 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
              Par type d&apos;événement
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
              Choisissez votre guide
            </h2>
          </Reveal>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g, i) => (
              <Reveal key={g.href} delay={i * 80}>
                <Link
                  href={g.href}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-violet/20 hover:shadow-xl hover:shadow-violet/5"
                >
                  <div className="h-40 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.image}
                      alt={g.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-semibold text-plum">
                      {g.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate">
                      {g.text}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-violet">
                      Lire le guide
                      <ArrowRight
                        size={16}
                        className="transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-slate">
            Tous les prestataires sont vérifiés avant publication.{" "}
            <Link
              href="/confiance"
              className="font-semibold text-violet hover:text-violet-dark"
            >
              Découvrez comment nous vérifions chaque profil
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
