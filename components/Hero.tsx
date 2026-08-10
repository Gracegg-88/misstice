"use client";

import { useEffect, useRef, useState } from "react";
import { Users } from "lucide-react";

const SPARK_PATH =
  "M32 3 Q32 32 61 32 Q32 32 32 61 Q32 32 3 32 Q32 32 32 3 Z";

// Profondeur : chaque étincelle a une échelle propre pour un effet de dispersion
// moins mécanique (certaines vont plus loin / restent plus grandes que d'autres),
// et pour un flou façon bokeh sur celles "loin" de la caméra.
const SPARKLES = [
  { color: "#FF8C42", size: 58, depth: 1 },
  { color: "#6C3CE1", size: 38, depth: 0.7 },
  { color: "#6C3CE1", size: 48, depth: 1 }, // ← étoile "hero", seule visible avant le scroll
  { color: "#FF8C42", size: 52, depth: 0.85 },
  { color: "#6C3CE1", size: 68, depth: 1.2 },
  { color: "#FF8C42", size: 42, depth: 0.7 },
  { color: "#6C3CE1", size: 34, depth: 0.6 },
];
const HERO_SPARK_INDEX = 2;

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function hexToRgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function sparkGlow(color: string, depth: number) {
  const blur = depth < 0.9 ? (0.9 - depth) * 3.5 : 0;
  const glowSize = lerp(10, 30, clamp(depth / 1.2, 0, 1));
  return `blur(${blur}px) drop-shadow(0 0 ${glowSize}px ${hexToRgba(color, 0.65)}) drop-shadow(0 8px 16px rgba(20,10,40,0.22))`;
}

export default function Hero() {
  const stageRef = useRef<HTMLElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const gapRef = useRef<HTMLDivElement>(null);
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

  // Ancre le champ d'étincelles pile dans l'espace entre le bandeau et le titre
  // (mesuré dynamiquement, pour rester juste quelle que soit la taille d'écran).
  useEffect(() => {
    function positionField() {
      if (viewRef.current && gapRef.current && fieldRef.current) {
        const viewRect = viewRef.current.getBoundingClientRect();
        const gapRect = gapRef.current.getBoundingClientRect();
        const centerY = gapRect.top - viewRect.top + gapRect.height / 2;
        fieldRef.current.style.top = `${centerY}px`;
      }
    }
    positionField();
    window.addEventListener("resize", positionField);
    return () => window.removeEventListener("resize", positionField);
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
        el.style.filter = sparkGlow(cfg.color, cfg.depth);
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
          // Seule l'étoile "hero" est visible avant le scroll ; les autres
          // apparaissent en fondu au fur et à mesure qu'elles s'écartent.
          const appear =
            i === HERO_SPARK_INDEX ? 1 : clamp(scatterP / 0.18, 0, 1);
          const opacity = (1 - revealP * 0.25) * appear;
          el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg) scale(${scale})`;
          el.style.opacity = String(opacity);
          el.style.filter = sparkGlow(cfg.color, cfg.depth);
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
        ref={viewRef}
        className="grain sticky top-16 flex h-[calc(100vh-4rem)] w-full items-center overflow-hidden bg-ink bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/wedding-crowd.jpg')" }}
      >
        {/* Voile sombre : garantit la lisibilité du texte quelle que soit la photo. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/55 to-ink/30"
        />
        {/* Transition vers la section suivante : fondu vers le cream du site. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-cream sm:h-36"
        />

        {/* ── Étincelles animées (rassemblées puis dispersées au scroll) ── */}
        <div
          ref={fieldRef}
          className="pointer-events-none absolute left-1/2 h-px w-px"
          style={{ top: "44%" }}
        >
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
              <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full">
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
            className="text-[11px] font-bold uppercase tracking-[0.14em] text-festif"
          >
            On transforme le stress de l&apos;organisation en plaisir.
          </div>
          {/* Zone tampon dédiée à l'étoile "hero" : elle est centrée dans cet
              espace, à distance du bandeau et du titre des deux côtés. */}
          <div ref={gapRef} aria-hidden="true" className="h-12 sm:h-16" />
          <p className="max-w-[18ch] font-display text-3xl font-semibold leading-tight text-cream sm:text-4xl">
            Mille petits détails,
            <br />
            dispersés partout.
          </p>
        </div>

        {/* ── Contenu final, révélé une fois les étincelles dispersées ── */}
        <div
          ref={contentRef}
          className="relative mx-auto w-full max-w-2xl px-4 py-10 text-center opacity-0 sm:px-8 lg:py-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-festif/30 bg-ink/60 px-4 py-1.5 text-sm font-medium text-festif backdrop-blur-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.svg"
              alt=""
              aria-hidden="true"
              className="h-4 w-4"
            />
            On transforme le stress de l&apos;organisation en plaisir.
          </span>

          <h1 className="mx-auto mt-5 max-w-[16ch] font-display text-4xl font-semibold leading-[1.05] tracking-tight text-cream sm:text-5xl lg:text-[52px]">
            Mille petits détails, dispersés partout.
            <br />
            On les réunit{" "}
            <span className="bg-gradient-to-r from-festif to-[#FFB27A] bg-clip-text text-transparent">
              au même endroit.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-cream/75 sm:text-lg">
            Budget, invités, checklist, équipe et prestataires réunis dans une
            seule plateforme.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href="/creer"
              className="ev-cta inline-flex items-center justify-center rounded-2xl px-7 py-4 text-base font-semibold text-cream shadow-lg shadow-violet/25"
            >
              Créer mon événement
            </a>
            <a
              href="/creer?type=pro"
              className="ev-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-semibold text-cream shadow-lg shadow-navy/20"
            >
              Je suis prestataire
              <Users size={18} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
