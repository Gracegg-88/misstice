import { Users } from "lucide-react";

// Étincelles Misstice superposées à la photo de fond (indépendantes de l'image,
// donc redimensionnables librement — contrairement à celles dessinées dans background.png).
const SPARKLES = [
  { top: "8%", left: "5%", size: 44, color: "#FF8C42", rotate: -10, delay: "0s" },
  { top: "18%", left: "18%", size: 26, color: "#6C3CE1", rotate: 14, delay: "1.4s" },
  { top: "60%", left: "3%", size: 34, color: "#6C3CE1", rotate: 6, delay: "2.2s" },
  { top: "10%", right: "8%", size: 38, color: "#FF8C42", rotate: -14, delay: "0.7s" },
  { top: "28%", right: "20%", size: 52, color: "#6C3CE1", rotate: 10, delay: "1.9s" },
  { top: "64%", right: "5%", size: 30, color: "#FF8C42", rotate: -6, delay: "0.4s" },
];

function Sparkle({
  top,
  left,
  right,
  size,
  color,
  rotate,
  delay,
}: {
  top: string;
  left?: string;
  right?: string;
  size: number;
  color: string;
  rotate: number;
  delay: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="ev-float pointer-events-none absolute drop-shadow-[0_4px_12px_rgba(108,60,225,0.3)]"
      style={{
        top,
        left,
        right,
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        animationDelay: delay,
      }}
    >
      <path
        d="M32 3 Q32 32 61 32 Q32 32 32 61 Q32 32 3 32 Q32 32 32 3 Z"
        fill={color}
      />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-cream bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="pointer-events-none absolute inset-0">
        {SPARKLES.map((s, i) => (
          <Sparkle key={i} {...s} />
        ))}
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
