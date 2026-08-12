import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, Users, Store, ArrowRight, BookOpen, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Comment organiser votre événement | Guides Misstice",
  description:
    "Découvrez comment Misstice simplifie l'organisation de votre événement, puis consultez le guide dédié à votre projet : mariage, anniversaire, baptême, événement professionnel ou baby shower.",
  alternates: { canonical: "/comment-ca-marche" },
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
    tone: "bg-ink text-cream",
    title: "Organiser un mariage",
    text: "Budget moyen, checklist mois par mois et conseils pour un mariage réussi, petit comité ou grand jour.",
  },
  {
    href: "/organiser-un-anniversaire",
    tone: "bg-festif text-plum",
    title: "Organiser un anniversaire",
    text: "De la petite fête entre proches à la grande soirée, tout pour organiser un anniversaire sans stress.",
  },
  {
    href: "/organiser-un-bapteme",
    tone: "bg-white/70 text-plum",
    title: "Organiser un baptême",
    text: "Cérémonie, réception et prestataires : le guide pour organiser un baptême serein du début à la fin.",
  },
  {
    href: "/organiser-un-evenement-professionnel",
    tone: "bg-violet text-cream",
    title: "Organiser un événement professionnel",
    text: "Séminaire, gala ou soirée d'entreprise : la méthode pour un événement professionnel maîtrisé.",
  },
  {
    href: "/organiser-une-baby-shower",
    tone: "bg-festif-soft text-plum",
    title: "Organiser une baby shower",
    text: "Préparez l'arrivée de bébé avec une organisation simple, entre budget raisonnable et bons souvenirs.",
  },
];

export default function CommentCaMarchePage() {
  return (
    <>
      <Header />
      <main className="bg-cream">
        <div className="mx-auto max-w-content px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
          <Reveal className="grid gap-8 lg:grid-cols-[1fr_.42fr] lg:items-end">
            <div>
              <p className="font-label text-[10px] font-medium uppercase tracking-[0.16em] text-violet">Des méthodes qui restent proches de vous</p>
              <h1 className="mt-4 max-w-[13ch] font-display text-4xl font-semibold leading-[.9] tracking-tight text-plum sm:text-5xl lg:text-6xl">Un guide pour chaque moment. Une même façon de <em className="font-normal text-violet">garder le fil.</em></h1>
              <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-slate sm:text-lg">Budget, échéances, idées et prestataires : choisissez un point de départ adapté à ce que vous préparez.</p>
            </div>
            <div className="flex gap-3 border-l-2 border-festif pl-4 text-sm font-light leading-relaxed text-slate"><BookOpen className="shrink-0 text-festif" size={19} /><p>Des contenus pensés pour vous aider à décider, pas pour vous faire défiler sans fin.</p></div>
          </Reveal>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.n} delay={i * 120} className="h-full">
                <div className="group flex h-full items-start gap-4 p-3 transition-all hover:-translate-y-1">
                  <div className="relative shrink-0">
                    <span className="flex h-12 w-12 items-center justify-center text-violet">
                      <step.icon size={26} strokeWidth={1.75} />
                    </span>
                    <span className="absolute -left-1 -top-3 font-display text-2xl font-normal italic text-festif">
                      {step.n}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-semibold leading-[1.02] text-plum">
                      {step.title}
                    </h2>
                    <p className="mt-2 text-sm font-light leading-relaxed text-slate">
                      {step.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16">
            <p className="font-label text-[10px] font-medium uppercase tracking-[0.16em] text-violet">Par type d&apos;événement</p>
            <h2 className="mt-3 max-w-[14ch] font-display text-3xl font-semibold leading-[.95] tracking-tight text-plum sm:text-4xl">Choisissez le feuillet qui vous ressemble.</h2>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g, i) => (
              <Reveal key={g.href} delay={i * 80}>
                <Link
                  href={g.href}
                  className={`group relative flex min-h-64 h-full flex-col overflow-hidden p-6 transition-all hover:-translate-y-1 ${g.tone}`}
                >
                  <span className="font-label text-[10px] uppercase tracking-[0.15em] opacity-65">0{i + 1}</span>
                  <Sparkles className="absolute bottom-6 right-6 opacity-60" size={22} />
                  <div className="mt-auto flex flex-1 flex-col">
                    <h3 className="max-w-[12ch] font-display text-3xl font-semibold leading-[.94]">
                      {g.title}
                    </h3>
                    <p className="mt-3 flex-1 text-sm font-light leading-relaxed opacity-75">
                      {g.text}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-festif decoration-2 underline-offset-8">
                      Préparer ce moment
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

          <div className="mt-12 flex flex-col gap-5 border-t border-plum/10 pt-7 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3 text-sm font-light text-slate"><Sparkles className="shrink-0 text-festif" size={18} /><p>Vous avez déjà une idée ? Commencez directement par votre projet.</p></div><Link href="/creer" className="inline-flex items-center gap-2 text-sm font-semibold text-violet underline decoration-festif decoration-2 underline-offset-6">Créer mon événement <ArrowRight size={16} /></Link></div>
        </div>
      </main>
      <Footer />
    </>
  );
}
