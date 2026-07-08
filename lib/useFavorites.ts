"use client";

import { useCallback, useEffect, useState } from "react";

// Favoris prestataires persistés localement (pas de compte requis).
const KEY = "misstice_favorites";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* quota / mode privé : on ignore */
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);

  // Hydrate depuis localStorage après le montage (évite le mismatch SSR).
  useEffect(() => {
    setIds(read());
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      write(next);
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
