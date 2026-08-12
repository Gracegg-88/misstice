/**
 * Carnet de Confiance — hero court de Misstice.
 * L’information essentielle est accessible sans scroll ; les CTA gardent les routes réelles de création organisateur et prestataire.
 */
import { ArrowDownRight, CheckCircle2, Users } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream px-4 pb-10 pt-10 sm:px-8 sm:pb-14 lg:pb-16 lg:pt-16">
      <div aria-hidden="true" className="absolute right-[9%] top-12 hidden h-[28rem] w-[28rem] rounded-full border border-festif/40 lg:block" />
      <div aria-hidden="true" className="absolute right-[21%] top-32 hidden h-4 w-4 rounded-full bg-festif lg:block" />
      <div className="relative mx-auto grid max-w-content items-center gap-10 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
        <div className="max-w-xl">
          <p className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.15em] text-plum/70"><span className="h-px w-9 bg-festif" /> Les moments qui comptent, bien entourés</p>
          <h1 className="max-w-[10ch] font-display text-5xl font-semibold leading-[.91] tracking-tight text-plum sm:text-6xl lg:text-7xl">
            Votre fête commence par une décision simple.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate sm:text-lg">
            Misstice réunit votre projet, vos proches et des prestataires vérifiés pour comparer les devis et préparer chaque moment à votre rythme.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="/creer" className="inline-flex min-h-14 items-center justify-center gap-2 bg-violet px-6 py-3 text-base font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5">
              Créer mon événement <ArrowDownRight size={19} />
            </a>
            <a href="/creer?type=pro" className="inline-flex min-h-14 items-center justify-center gap-2 border border-plum/25 bg-white/60 px-6 py-3 text-base font-semibold text-plum transition-colors duration-200 hover:border-violet hover:text-violet">
              Je suis prestataire <Users size={18} />
            </a>
          </div>
          <div className="mt-7 grid gap-3 border-t border-plum/15 pt-5 sm:grid-cols-2">
            <span className="flex items-start gap-2 text-xs leading-relaxed text-slate"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-festif" /> Devis gratuit, sans engagement.</span>
            <span className="flex items-start gap-2 text-xs leading-relaxed text-slate"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-festif" /> Coordonnées protégées jusqu’à votre accord.</span>
          </div>
        </div>

        <div className="relative min-h-[25rem] sm:min-h-[32rem]">
          <div className="absolute inset-0 overflow-hidden bg-ink shadow-[16px_16px_0_#FF8C42] sm:left-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wedding-crowd.jpg" alt="Famille et proches réunis pour célébrer un moment important" className="h-full w-full object-cover object-center opacity-80" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 border-l-4 border-festif bg-cream p-4 shadow-xl sm:bottom-8 sm:left-8 sm:right-auto sm:w-72">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate">Votre projet</p>
              <p className="mt-1 font-display text-2xl font-semibold leading-none text-plum">Prêt à prendre forme.</p>
              <div className="mt-4 h-1 bg-plum/10"><span className="block h-full w-2/5 bg-violet" /></div>
            </div>
          </div>
          <div className="absolute -left-3 top-12 grid h-24 w-24 place-items-center rounded-full bg-festif text-center font-display text-lg font-semibold leading-none text-plum sm:-left-4">à votre<br />rythme</div>
        </div>
      </div>
    </section>
  );
}
