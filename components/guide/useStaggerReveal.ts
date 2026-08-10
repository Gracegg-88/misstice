"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Un seul IntersectionObserver sur le conteneur ; une fois qu'il entre dans
 * le viewport, `visible` passe à true — les enfants (lignes de tableau,
 * items de liste) appliquent alors .reveal-row/.reveal-item avec un délai
 * `i * stepMs` pour l'effet de cascade.
 */
export function useStaggerReveal<T extends HTMLElement>(stepMs = 60) {
  const ref = useRef<T>(null);
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
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const delayFor = (i: number) => ({ transitionDelay: `${i * stepMs}ms` });

  return { ref, visible, delayFor };
}
