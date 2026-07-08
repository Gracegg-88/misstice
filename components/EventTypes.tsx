import { Heart } from "lucide-react";
import Reveal from "./Reveal";

const types = [
  { img: "/mariage.png", label: "Mariage", text: "Célébrez votre amour" },
  { img: "/anniversaire.png", label: "Anniversaire", text: "Créez des souvenirs inoubliables" },
  { img: "/bapteme.png", label: "Baptême", text: "Un moment rempli de douceur" },
  { img: "/gala.png", label: "Gala", text: "Organisez des événements d'exception" },
  { img: "/babyshower.png", label: "Baby Shower", text: "Accueillez bébé comme il se doit" },
];

export default function EventTypes() {
  return (
    <section id="fonctionnalites" className="pt-14 pb-6 sm:pt-16 sm:pb-8">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-festif/50" />
          <Heart size={15} className="fill-festif text-festif" />
          <h2 className="text-center font-display text-xl font-semibold tracking-tight text-plum">
            Pour tous vos moments importants
          </h2>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-festif/50" />
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {types.map((t, i) => (
            <Reveal key={t.label} delay={i * 70}>
              <a
                href="/creer"
                className="flex h-full items-center gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.img}
                  alt=""
                  aria-hidden="true"
                  className="h-14 w-14 shrink-0 object-contain"
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-plum">{t.label}</span>
                  <span className="block text-sm leading-snug text-slate">
                    {t.text}
                  </span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
