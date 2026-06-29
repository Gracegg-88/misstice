import { ArrowRight, Star, Heart } from "lucide-react";
import Parallax from "@/components/animations/Parallax";

export default function Hero() {
  return (
    <section className="grain relative overflow-hidden">
      {/* Fond : mesh dégradé chaud très subtil sur le crème */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 0%, rgba(108,60,225,0.10), transparent 70%)," +
            "radial-gradient(50% 45% at 95% 20%, rgba(255,140,66,0.12), transparent 70%)",
        }}
      />

      <div className="relative mx-auto grid max-w-content items-center gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2 lg:py-28">
        {/* ── Colonne texte ── */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-soft px-4 py-1.5 text-sm font-medium text-violet">
            <Heart size={14} className="fill-violet" />
            Pensé pour les familles qui aiment faire la fête
          </span>

          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-plum sm:text-6xl lg:text-7xl">
            Le grand jour,
            <br />
            sans le grand <span className="text-festif">stress</span>.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate">
            Budget, checklist, liste d&apos;invités et les meilleurs
            prestataires — tout réuni sur une seule plateforme. Misstice
            transforme l&apos;organisation en plaisir.
          </p>

          {/* Multi-tunnels : 1 CTA primaire, 1 secondaire discret */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="/creer"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-violet px-7 py-4 text-base font-semibold text-white shadow-lg shadow-violet/20 transition-all hover:bg-violet-dark hover:shadow-xl"
            >
              Je planifie un événement
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </a>
            <a
              href="/pro/inscription"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-plum/15 bg-white px-7 py-4 text-base font-semibold text-plum transition-colors hover:border-plum/30"
            >
              Je suis prestataire
            </a>
          </div>

          {/* Réassurance discrète */}
          <div className="mt-8 flex items-center gap-3 text-sm text-slate">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className="fill-festif text-festif"
                />
              ))}
            </div>
            <span>
              <strong className="text-plum">4,9/5</strong> — déjà des milliers
              de fêtes organisées
            </span>
          </div>
        </div>

        {/* ── Colonne visuel : aperçu produit en CSS pur ── */}
        <Parallax speed={-0.12} className="relative hidden lg:block">
          <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-festif/20 blur-2xl" />
          <div className="animate-float relative ml-auto max-w-sm rounded-3xl border border-black/5 bg-white p-6 shadow-2xl shadow-violet/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate">
                  Mariage · 14 juin
                </p>
                <p className="mt-1 font-display text-2xl font-semibold text-plum">
                  Awa &amp; Karim
                </p>
              </div>
              <span className="rounded-full bg-emerald-soft px-3 py-1 text-xs font-semibold text-emerald">
                Dans 42 jours
              </span>
            </div>

            {/* Barre de progression globale */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-plum">Organisation</span>
                <span className="text-slate">68%</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-violet-soft">
                <div className="h-full w-[68%] rounded-full bg-violet" />
              </div>
            </div>

            {/* Mini widgets */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs text-slate">Budget</p>
                <p className="mt-1 font-display text-xl font-semibold text-plum">
                  12 400 €
                </p>
                <p className="text-xs text-emerald">dans les clous ✓</p>
              </div>
              <div className="rounded-2xl bg-cream p-4">
                <p className="text-xs text-slate">Invités</p>
                <p className="mt-1 font-display text-xl font-semibold text-plum">
                  86 / 120
                </p>
                <p className="text-xs text-festif">confirmés</p>
              </div>
            </div>
          </div>
        </Parallax>
      </div>
    </section>
  );
}
