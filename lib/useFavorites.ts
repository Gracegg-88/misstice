"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Favoris prestataires. Réservés aux utilisateurs connectés : un clic sur le
// cœur sans session renvoie vers le formulaire de connexion.
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
  // null = statut d'authentification encore inconnu.
  const authed = useRef<boolean | null>(null);

  // Hydrate depuis localStorage + détecte la session après le montage.
  useEffect(() => {
    setIds(read());
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      authed.current = !!user;
    });
  }, []);

  const toggle = useCallback((id: string) => {
    // Pas connecté → on redirige vers la connexion (retour sur la page courante).
    if (authed.current === false) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/auth?next=${next}`;
      return;
    }
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
