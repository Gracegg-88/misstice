"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";

const SPARK_PATH =
  "M32 3 Q32 32 61 32 Q32 32 32 61 Q32 32 3 32 Q32 32 32 3 Z";

// Profondeur : chaque étincelle a une échelle propre pour un effet de dispersion
// moins mécanique (certaines vont plus loin / restent plus grandes que d'autres).
const SPARKLES = [
  { color: "#FF8C42", size: 34, depth: 1 },
  { color: "#6C3CE1", size: 22, depth: 0.7 },
  { color: "#6C3CE1", size: 28, depth: 1 },
  { color: "#FF8C42", size: 30, depth: 0.85 },
  { color: "#6C3CE1", size: 40, depth: 1.2 },
  { color: "#FF8C42", size: 24, depth: 0.7 },
  { color: "#6C3CE1", size: 20, depth: 0.6 },
];

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function Hero() {
  const stageRef = useRef<HTMLElement>(null);
  const sparkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const eyebrowRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      // Pas d'animation : on affiche directement l'état final, étincelles dispersées et figées.
      if (contentRef.current) {
        contentRef.current.style.opacity = "1";
        contentRef.current.style.transform = "none";
      }
      if (introRef.current) introRef.current.style.opacity = "0";
      if (eyebrowRef.current) eyebrowRef.current.style.opacity = "0";
      sparkRefs.current.forEach((el, i) => {
        if (!el) return;
        const cfg = SPARKLES[i];
        const angle = (i / SPARKLES.length) * Math.PI * 2;
        const radius = 220 * (0.8 + cfg.depth * 0.2);
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        el.style.transform = `translate(${x}px, ${y}px) scale(${cfg.depth})`;
        el.style.opacity = "0.85";
      });
      return;
    }

    let raf = 0;
    const t0 = performance.now();

    const render = () => {
      const stage = stageRef.current;
      if (stage) {
        const now = performance.now();
        const time = (now - t0) / 1000;
        const rect = stage.getBoundingClientRect();
        const total = stage.offsetHeight - window.innerHeight;
        const scrolled = clamp(-rect.top, 0, total);
        const p = total > 0 ? scrolled / total : 0;

        // Phases : 0–.5 rassemblement/dispersion des étincelles · .4–1 révélation du contenu
        const scatterP = clamp(p / 0.5, 0, 1);
        const revealP = clamp((p - 0.4) / 0.6, 0, 1);

        sparkRefs.current.forEach((el, i) => {
          if (!el) return;
          const cfg = SPARKLES[i];
          const angle = (i / SPARKLES.length) * Math.PI * 2 + time * 0.04;
          const radius = lerp(10, 300, scatterP) * (0.8 + cfg.depth * 0.2);
          const jitter = Math.sin(time * 0.7 + i) * 3 * (1 - scatterP * 0.7);
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius + jitter;
          const rot = lerp(0, i % 2 ? 220 : -180, scatterP) + time * 5;
          const scale = lerp(0.6, cfg.depth, clamp(scatterP * 1.6, 0, 1));
          const opacity = 1 - revealP * 0.25;
          el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
          el.style.opacity = String(opacity);
        });

        if (eyebrowRef.current) {
          eyebrowRef.current.style.opacity = String(1 - clamp(p / 0.28, 0, 1));
        }
        if (introRef.current) {
          introRef.current.style.opacity = String(
            1 - clamp(scatterP / 0.6, 0, 1)
          );
        }
        if (contentRef.current) {
          contentRef.current.style.opacity = String(revealP);
          contentRef.current.style.transform = `translateY(${lerp(28, 0, revealP)}px)`;
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  return (
    <section
      ref={stageRef}
      className="relative"
      style={{ height: reducedMotion ? undefined : "220vh" }}
    >
      <div
        className="sticky top-16 flex h-[calc(100vh-4rem)] w-full items-center overflow-hidden bg-cream bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      >
        {/* ── Étincelles animées (rassemblées puis dispersées au scroll) ── */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-px w-px">
          {SPARKLES.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                sparkRefs.current[i] = el;
              }}
              className="absolute left-0 top-0 will-change-transform"
              style={{
                width: s.size,
                height: s.size,
                marginLeft: -s.size / 2,
                marginTop: -s.size / 2,
              }}
            >
              <svg
                viewBox="0 0 64 64"
                aria-hidden="true"
                className="h-full w-full drop-shadow-[0_6px_14px_rgba(108,60,225,0.25)]"
              >
                <path d={SPARK_PATH} fill={s.color} />
              </svg>
            </div>
          ))}
        </div>

        {/* ── Intro : visible avant la dispersion, cède la place au contenu réel ── */}
        <div
          ref={introRef}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <div
            ref={eyebrowRef}
            className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-violet"
          >
            On transforme le stress de l&apos;organisation en plaisir.
          </div>
          <p className="max-w-[18ch] font-display text-3xl font-normal leading-tight text-plum sm:text-4xl">
            Mille petits détails,
            <br />
            dispersés partout.
          </p>
        </div>

        {/* ── Contenu final, révélé une fois les étincelles dispersées ── */}
        <div
          ref={contentRef}
          className="relative mx-auto grid w-full max-w-content items-center gap-10 px-4 py-10 opacity-0 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-12"
        >
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-festif/20 bg-white/70 px-4 py-1.5 text-sm font-medium text-festif backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon.svg"
                alt=""
                aria-hidden="true"
                className="h-4 w-4"
              />
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
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero.png"
              alt="Aperçu du tableau de bord Misstice : budget, checklist, invités et prestataires"
              className="w-full rounded-2xl border border-black/5 shadow-2xl shadow-violet/10"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
