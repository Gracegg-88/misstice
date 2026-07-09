import Reveal from "./Reveal";

const steps = [
  {
    n: 1,
    img: "/cree.png",
    title: "Créez votre événement",
    text: "Indiquez les informations essentielles et donnez vie à votre projet en quelques minutes.",
  },
  {
    n: 2,
    img: "/organiser.png",
    title: "Organisez budget, invités et tâches",
    text: "Gérez votre budget, suivez votre checklist et centralisez toutes les informations.",
  },
  {
    n: 3,
    img: "/reserve.png",
    title: "Réservez vos prestataires",
    text: "Trouvez les meilleurs prestataires, comparez et réservez en toute sérénité.",
  },
];

export default function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="pt-6 pb-6 sm:pt-8 sm:pb-8">
      <div className="mx-auto max-w-content px-5 sm:px-8">
        <Reveal className="flex items-center justify-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" aria-hidden="true" className="h-[18px] w-[18px]" />
          <h2 className="text-center font-display text-2xl font-semibold tracking-tight text-plum sm:text-3xl">
            Comment ça marche&nbsp;?
          </h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="" aria-hidden="true" className="h-[18px] w-[18px]" />
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.n} delay={i * 120} className="h-full">
              <div className="group flex h-full items-start gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-violet/5">
                {/* Illustration + pastille numérotée */}
                <div className="relative shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={step.img}
                    alt=""
                    aria-hidden="true"
                    className="h-24 w-24 object-contain"
                  />
                  <span className="absolute -left-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-festif font-display text-base font-bold text-white shadow-md shadow-festif/30">
                    {step.n}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="font-display text-lg font-semibold leading-snug text-plum">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">
                    {step.text}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
