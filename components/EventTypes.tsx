import Reveal from "./Reveal";

const types: {
  img: string;
  label: string;
  text: string;
  tint: string;
}[] = [
  { img: "/mariage.png", label: "Mariage", text: "Gérez chaque détail de votre grand jour", tint: "bg-violet-soft" },
  { img: "/anniversaire.png", label: "Anniversaire", text: "Planifiez en toute sérénité", tint: "bg-festif-soft" },
  { img: "/bapteme.png", label: "Baptême", text: "Organisez chaque instant avec soin", tint: "bg-violet-soft" },
  { img: "/gala.png", label: "Gala", text: "Un événement professionnel et mémorable", tint: "bg-festif-soft" },
  { img: "/babyshower.png", label: "Baby Shower", text: "Préparez l'arrivée de bébé sereinement", tint: "bg-violet-soft" },
];

export default function EventTypes() {
  return (
    <section id="fonctionnalites" className="pt-14 pb-6 sm:pt-16 sm:pb-8">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet">
            Types d&apos;événements
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-plum sm:text-2xl">
            Pour tous vos moments importants
          </h2>
        </Reveal>

        <div className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {types.map((t, i) => (
            <Reveal key={t.label} delay={i * 70}>
              <a
                href="/creer"
                className="ev-zoom-hover flex h-full flex-col items-center gap-3 rounded-2xl border border-black/5 bg-white p-5 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-violet/20 hover:shadow-lg hover:shadow-violet/5"
              >
                <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${t.tint}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.img}
                    alt=""
                    aria-hidden="true"
                    className="ev-zoom-target h-11 w-11 object-contain"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-plum">{t.label}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-slate">
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
