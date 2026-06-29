"use client";

import { useEffect, useRef } from "react";

/**
 * Effet parallax : déplace doucement l'élément en fonction du scroll.
 * speed > 0 = monte plus lentement (effet de profondeur).
 * Désactivé si l'utilisateur préfère réduire le mouvement.
 */
export default function Parallax({
  children,
  speed = 0.2,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduce) return;

    let raf = 0;
    const update = () => {
      const offset = window.scrollY * speed;
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
