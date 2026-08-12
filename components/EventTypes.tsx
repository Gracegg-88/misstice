import Link from "next/link";
import { Gem, Cake, Church, Sparkles, Baby } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Reveal from "./Reveal";

const types: {
  icon: LucideIcon;
  label: string;
  text: string;
}[] = [
  { icon: Gem, label: "Mariage", text: "Gérez chaque détail de votre grand jour" },
  { icon: Cake, label: "Anniversaire", text: "Planifiez en toute sérénité" },
  { icon: Church, label: "Baptême", text: "Organisez chaque instant avec soin" },
  { icon: Sparkles, label: "Gala", text: "Un événement professionnel et mémorable" },
  { icon: Baby, label: "Baby Shower", text: "Préparez l'arrivée de bébé sereinement" },
];

export default function EventTypes() {
  return (
    <section id="fonctionnalites" className="pt-10 pb-4 sm:pt-12 sm:pb-6">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="font-label text-[10px] font-medium uppercase tracking-[0.18em] text-violet">
            Types d&apos;événements
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
            Pour tous vos moments importants
          </h2>
        </Reveal>

        <Reveal delay={60} className="mt-6 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/family-santa.jpg"
            alt="Famille réunie et complice pour une fête de famille"
            className="h-48 w-full object-cover sm:h-64"
          />
        </Reveal>

        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
          {types.map((t, i) => (
            <Reveal key={t.label} delay={i * 70}>
              <a
                href="/creer"
                className="flex h-full min-h-[44px] flex-col items-start gap-2 p-2 transition-all hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-3"
              >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-violet">
                  <t.icon size={22} strokeWidth={1.75} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold leading-none text-plum">{t.label}</span>
                  <span className="mt-1 block text-sm font-light leading-snug text-slate">
                    {t.text}
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate">
          Une question avant de vous lancer ?{" "}
          <Link
            href="/faq"
            className="font-semibold text-violet hover:text-violet-dark"
          >
            Consultez notre foire aux questions
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
