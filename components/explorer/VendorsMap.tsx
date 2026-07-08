"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { getCoords, type Vendor } from "./vendors";

/**
 * Carte interactive (Leaflet + tuiles OpenStreetMap, sans token).
 * Un pin par prestataire. Au clic : nom, catégorie et "Voir le profil"
 * vers la fiche Misstice — rien d'externe (pas de téléphone, pas de lien
 * Google, pas d'avis tiers). Tout reste centralisé sur Misstice.
 */
export default function VendorsMap({ vendors }: { vendors: Vendor[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // on garde l'instance pour la nettoyer / mettre à jour
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          scrollWheelZoom: false,
        }).setView([46.6, 2.4], 5);
        L.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "© OpenStreetMap",
            maxZoom: 18,
          }
        ).addTo(mapRef.current);
      }

      // (re)dessine les marqueurs à chaque changement de filtre
      if (layerRef.current) {
        mapRef.current.removeLayer(layerRef.current);
      }
      layerRef.current = L.layerGroup().addTo(mapRef.current);

      const icon = L.divIcon({
        className: "",
        html: '<div class="ev-pin"></div>',
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26],
      });

      const points: [number, number][] = [];
      vendors.forEach((v) => {
        const coords = getCoords(v);
        points.push(coords);

        // Construction DOM (textContent) → pas d'injection HTML via name/category.
        const wrap = document.createElement("div");
        wrap.style.minWidth = "180px";
        const title = document.createElement("p");
        title.textContent = v.name;
        title.style.cssText =
          "font-family:'Playfair Display',serif;font-weight:600;font-size:16px;color:#1A1A2E;margin:0";
        const cat = document.createElement("p");
        cat.textContent = v.category;
        cat.style.cssText =
          "font-size:12px;color:#FF8C42;font-weight:500;text-transform:uppercase;letter-spacing:.04em;margin:2px 0 10px";
        const link = document.createElement("a");
        link.textContent = "Voir le profil";
        link.setAttribute("href", `/prestataires/${encodeURIComponent(v.id)}`);
        link.style.cssText =
          "display:inline-block;background:#6C3CE1;color:#fff;font-size:13px;font-weight:600;text-decoration:none;padding:8px 14px;border-radius:10px";
        wrap.append(title, cat, link);

        L.marker(coords, { icon })
          .addTo(layerRef.current)
          .bindPopup(wrap);
      });

      if (points.length) {
        mapRef.current.fitBounds(points, { padding: [40, 40], maxZoom: 6 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vendors]);

  // nettoyage complet au démontage
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-[560px] w-full overflow-hidden rounded-3xl border border-black/5"
      role="region"
      aria-label="Carte des prestataires"
    />
  );
}
