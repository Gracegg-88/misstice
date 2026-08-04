import { Users, CheckCheck, PartyPopper, Star } from "lucide-react";

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-cream bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {/* Aura lumineuse en fond, purement décorative */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="ev-float absolute -left-24 top-10 h-72 w-72 rounded-full bg-violet/20 blur-[90px]" />
        <div
          className="ev-float absolute -right-16 top-1/3 h-80 w-80 rounded-full bg-festif/20 blur-[100px]"
          style={{ animationDelay: "1.5s" }}
        />
      </div>

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
              className="inline-flex items-center justify-center rounded-2xl bg-violet px-7 py-4 text-base font-semibold text-white shadow-lg shadow-violet/25 transition-all hover:-translate-y-0.5 hover:bg-violet-dark hover:shadow-xl"
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

          {/* Preuve sociale légère */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-3">
              {["/avis-1.png", "/avis-2.png", "/avis-3.png"].map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden="true"
                  className="h-9 w-9 rounded-full border-2 border-cream object-cover"
                />
              ))}
            </div>
            <p className="text-sm text-slate">
              <span className="inline-flex items-center gap-0.5 align-middle text-festif">
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} size={13} className="fill-festif text-festif" />
                ))}
              </span>{" "}
              <span className="font-semibold text-plum">4,9/5</span> ·
              déjà 500+ familles accompagnées
            </p>
          </div>
        </div>

        {/* ── Colonne visuel : aperçu du tableau de bord ── */}
        <div className="relative animate-fade-up" style={{ animationDelay: "120ms" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.png"
            alt="Aperçu du tableau de bord Misstice : budget, checklist, invités et prestataires"
            className="w-full rounded-2xl border border-black/5 shadow-2xl shadow-violet/10"
          />

          {/* Cartes flottantes : preuve du produit en action */}
          <div
            className="ev-float absolute -left-4 -top-5 hidden items-center gap-2.5 rounded-2xl border border-black/5 bg-white/95 px-4 py-3 shadow-xl shadow-plum/10 backdrop-blur-sm sm:flex"
            style={{ animationDelay: "0.6s" }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-soft text-emerald">
              <CheckCheck size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold text-plum">Checklist à jour</p>
              <p className="text-[11px] text-slate">32/40 tâches terminées</p>
            </div>
          </div>

          <div
            className="ev-float absolute -bottom-5 -right-3 hidden items-center gap-2.5 rounded-2xl border border-black/5 bg-white/95 px-4 py-3 shadow-xl shadow-plum/10 backdrop-blur-sm sm:flex"
            style={{ animationDelay: "1.2s" }}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-festif-soft text-festif">
              <PartyPopper size={18} />
            </span>
            <div>
              <p className="text-xs font-semibold text-plum">Invités confirmés</p>
              <p className="text-[11px] text-slate">87 sur 120</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
