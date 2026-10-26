"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Affiche une fiche Google via le « Places UI Kit » officiel
 * (<gmp-place-details-compact>) : c'est Google qui récupère et affiche la
 * note, le nombre d'avis et l'attribution, en direct. Rien n'est stocké chez
 * nous hormis le place_id (conformité Google Maps Platform, comptes EEE :
 * voir docs/google-places.md).
 *
 * Clé navigateur : NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY, distincte de la clé
 * serveur GOOGLE_PLACES_API_KEY, restreinte dans Google Cloud aux domaines
 * misstice.com et à la seule « Maps JavaScript API ». Sans clé, rien ne
 * s'affiche (aucune erreur visible).
 *
 * Facturation : SKU « Places UI Kit Query », 1 requête par affichage
 * (10 000 gratuites / mois, puis 1 $ les 1 000).
 */

const BROWSER_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY;

let loader: Promise<void> | null = null;

/** Charge une seule fois la Maps JavaScript API (bibliothèque places). */
function loadPlacesUiKit(): Promise<void> {
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    if (!BROWSER_KEY) {
      reject(new Error("Clé Google Maps absente."));
      return;
    }
    if (customElements.get("gmp-place-details-compact")) {
      resolve();
      return;
    }
    const cb = "__missticeGoogleMapsReady";
    (window as unknown as Record<string, () => void>)[cb] = () => resolve();
    const params = new URLSearchParams({
      key: BROWSER_KEY,
      v: "weekly",
      libraries: "places",
      loading: "async",
      language: "fr",
      region: "FR",
      callback: cb,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loader = null;
      reject(new Error("Chargement Google Maps impossible."));
    };
    document.head.appendChild(script);
  }).then(() => customElements.whenDefined("gmp-place-details-compact").then(() => undefined));
  return loader;
}

/** Lien officiel vers la fiche Google Maps (format d'URL documenté par Google). */
export function googleMapsUrl(placeId: string, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    name
  )}&query_place_id=${encodeURIComponent(placeId)}`;
}

export const googlePlacesEnabled = Boolean(BROWSER_KEY);

export default function GooglePlaceCard({
  placeId,
  variant = "rating",
  className = "",
}: {
  placeId: string;
  /** "rating" : nom + note (fiche publique). "preview" : + adresse et type (validation). */
  variant?: "rating" | "preview";
  className?: string;
}) {
  const [state, setState] = useState<"waiting" | "loading" | "ready" | "error">("waiting");
  const ref = useRef<HTMLDivElement>(null);

  // Chargement à l'apparition à l'écran : chaque affichage est facturé par
  // Google, on n'en déclenche donc que si le visiteur voit réellement le bloc.
  useEffect(() => {
    const el = ref.current;
    if (!el || state !== "waiting") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect();
          setState("loading");
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [state]);

  useEffect(() => {
    if (state !== "loading") return;
    let alive = true;
    loadPlacesUiKit()
      .then(() => alive && setState("ready"))
      .catch(() => alive && setState("error"));
    return () => {
      alive = false;
    };
  }, [state]);

  if (state === "error") {
    return variant === "preview" ? (
      <p className={`text-sm text-slate ${className}`}>
        Aperçu Google indisponible (identifiant : {placeId}).
      </p>
    ) : null;
  }
  if (state !== "ready") {
    return (
      <div
        ref={ref}
        className={`h-20 animate-pulse rounded-2xl bg-black/5 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={className}>
      <gmp-place-details-compact orientation="horizontal">
        <gmp-place-details-place-request place={placeId}></gmp-place-details-place-request>
        <gmp-place-name></gmp-place-name>
        {variant === "preview" && <gmp-place-address></gmp-place-address>}
        <gmp-place-rating></gmp-place-rating>
        {variant === "preview" && <gmp-place-type></gmp-place-type>}
        <gmp-place-attribution light-scheme-color="gray"></gmp-place-attribution>
      </gmp-place-details-compact>
    </div>
  );
}
