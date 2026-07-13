"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Favoris prestataires — persistés en base (table vendor_favorites), donc
// communs à tous les événements du compte. Réservés aux utilisateurs connectés :
// un clic sur le cœur sans session renvoie vers le formulaire de connexion.
export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  // null = statut d'authentification encore inconnu.
  const userId = useRef<string | null>(null);
  const authKnown = useRef(false);

  // Détecte la session et charge les favoris depuis la base après le montage.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      authKnown.current = true;
      userId.current = user?.id ?? null;
      if (!user) return;
      const { data } = await supabase
        .from("vendor_favorites")
        .select("vendor_id")
        .eq("user_id", user.id);
      if (data) setIds((data as { vendor_id: string }[]).map((r) => r.vendor_id));
    });
  }, []);

  const toggle = useCallback((id: string) => {
    // Pas connecté → on redirige vers la connexion (retour sur la page courante).
    if (authKnown.current && !userId.current) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/auth?next=${next}`;
      return;
    }
    const uid = userId.current;
    if (!uid) return; // session pas encore résolue → on ignore le clic

    setIds((prev) => {
      const isFav = prev.includes(id);
      const next = isFav ? prev.filter((x) => x !== id) : [...prev, id];
      // Persistance en base (optimiste ; on ne bloque pas l'UI).
      const supabase = createClient();
      if (isFav) {
        void supabase
          .from("vendor_favorites")
          .delete()
          .eq("user_id", uid)
          .eq("vendor_id", id);
      } else {
        void supabase
          .from("vendor_favorites")
          .insert({ user_id: uid, vendor_id: id });
      }
      return next;
    });
  }, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, toggle, has };
}
