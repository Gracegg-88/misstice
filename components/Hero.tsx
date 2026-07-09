import { Users } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-cream bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="relative mx-auto grid w-full max-w-content items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-12">
        {/* ── Colonne texte ── */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-festif/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-festif backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="" aria-hidden="true" className="h-4 w-4" />
            On transforme le stress de l&apos;organisation en plaisir.
          </span>

          <h1 className="mt-5 max-w-[14ch] font-display text-4xl font-semibold leading-[1.05] tracking-tight text-plum sm:text-5xl lg:text-[52px]">
            Organisez vos plus beaux événements,{" "}
            <span className="bg-gradient-to-r from-festif to-[#FFB27A] bg-clip-text text-transparent">
              sans stress.
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate sm:text-lg">
            Budget, invités, checklist, équipe et prestataires réunis dans une
            seule plateforme.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="/creer"
              className="inline-flex items-center justify-center rounded-2xl bg-violet px-7 py-4 text-base font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:bg-violet-dark hover:shadow-xl"
            >
              Créer mon événement
            </a>
            <a
              href="/creer?type=pro"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-plum/15 bg-white/70 px-7 py-4 text-base font-semibold text-plum backdrop-blur-sm transition-colors hover:border-plum/30"
            >
              Je suis prestataire
              <Users size={18} />
            </a>
          </div>
        </div>

        {/* ── Colonne visuel : aperçu du tableau de bord ── */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.png"
            alt="Aperçu du tableau de bord Misstice : budget, checklist, invités et prestataires"
            className="w-full rounded-2xl border border-black/5 shadow-2xl shadow-violet/10"
          />
        </div>
      </div>
    </section>
  );
}
