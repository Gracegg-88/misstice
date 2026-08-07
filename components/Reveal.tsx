"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Enveloppe un bloc pour le faire apparaître en fondu quand il entre à l'écran.
 * Aucune librairie nécessaire — on utilise IntersectionObserver (natif au navigateur).
 * Le mouvement est désactivé automatiquement si l'utilisateur préfère réduire les animations
 * (géré dans globals.css).
 */
export default function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  /** "up" : fondu + léger translateY (défaut). "scale" : fondu + zoom 0.95→1, pour les CTA. */
  variant?: "up" | "scale";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = variant === "scale" ? "reveal-scale" : "reveal";

  return (
    <div
      ref={ref}
      className={`${base} ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
