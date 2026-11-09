"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Affiche une fiche Google via le « Places UI Kit » officiel
 * (<gmp-place-details> pour les avis, <gmp-place-details-compact> pour les
 * aperçus) : c'est Google qui récupère et affiche la note, les avis et
 * l'attribution, en direct. Rien n'est stocké chez
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

export const googlePlacesEnabled = Boolean(BROWSER_KEY);

export default function GooglePlaceCard({
  placeId,
  variant = "reviews",
  className = "",
}: {
  placeId: string;
  /**
   * "reviews" : nom, note et avis Google (fiche publique) ;
   * "preview" : nom, adresse, note et type (validation admin / pro).
   */
  variant?: "reviews" | "preview";
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

  if (variant === "reviews") {
    // Élément complet (avis inclus), même tarif que le compact. Contenu
    // volontairement limité au nom, à la note et aux avis : ni téléphone, ni
    // site web, ni horaires, pour ne pas faire sortir le client de Misstice.
    // Les liens d'attribution que Google place dans les avis (auteur, source)
    // sont obligatoires et ne peuvent pas être retirés.
    return (
      <div className={`h-[560px] w-full max-w-[400px] ${className}`}>
        <gmp-place-details style={{ height: "100%", display: "block" }}>
          <gmp-place-details-place-request place={placeId}></gmp-place-details-place-request>
          <gmp-place-name></gmp-place-name>
          <gmp-place-rating></gmp-place-rating>
          <gmp-place-reviews></gmp-place-reviews>
          <gmp-place-attribution light-scheme-color="gray"></gmp-place-attribution>
        </gmp-place-details>
      </div>
    );
  }

  return (
    <div className={className}>
      <gmp-place-details-compact orientation="horizontal">
        <gmp-place-details-place-request place={placeId}></gmp-place-details-place-request>
        <gmp-place-name></gmp-place-name>
        <gmp-place-address></gmp-place-address>
        <gmp-place-rating></gmp-place-rating>
        <gmp-place-type></gmp-place-type>
        <gmp-place-attribution light-scheme-color="gray"></gmp-place-attribution>
      </gmp-place-details-compact>
    </div>
  );
}
