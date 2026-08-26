"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DirectoryPick } from "@/lib/geo";

/**
 * Carte interactive (Leaflet + tuiles OpenStreetMap) pour les sélections
 * "Top 10" éditoriales (voir components/geo/PicksList.tsx). Contrairement à
 * VendorsMap (explorer/), le clic sur un repère n'affiche jamais "Voir le
 * profil" — ces prestataires ne sont pas inscrits sur Misstice, juste
 * ouvrir un itinéraire externe.
 */
export default function PicksMap({ picks }: { picks: DirectoryPick[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  const located = picks.filter(
    (p): p is DirectoryPick & { lat: number; lng: number } =>
      p.lat != null && p.lng != null
  );

  useEffect(() => {
    let cancelled = false;
    if (!located.length) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          scrollWheelZoom: false,
        }).setView([46.6, 2.4], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap",
          maxZoom: 18,
        }).addTo(mapRef.current);
      }

      if (layerRef.current) mapRef.current.removeLayer(layerRef.current);
      layerRef.current = L.layerGroup().addTo(mapRef.current);
      const map = mapRef.current;
      const layer = layerRef.current;

      const points: [number, number][] = [];
      located.forEach((p) => {
        const coords: [number, number] = [p.lat, p.lng];
        points.push(coords);

        const icon = L.divIcon({
          className: "",
          html: `<div class="ev-pin-rank"><span>${p.rank}</span></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26],
        });

        const wrap = document.createElement("div");
        wrap.style.minWidth = "180px";
        const title = document.createElement("p");
        title.textContent = p.name;
        title.style.cssText =
          "font-family:'Playfair Display',serif;font-weight:600;font-size:15px;color:#1A1A2E;margin:0";
        const addr = document.createElement("p");
        addr.textContent = p.address;
        addr.style.cssText = "font-size:12px;color:#6B7280;margin:2px 0 0";
        wrap.append(title, addr);

        L.marker(coords, { icon }).addTo(layer).bindPopup(wrap);
      });

      if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 13 });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picks]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (!located.length) return null;

  return (
    <div
      ref={containerRef}
      className="h-56 w-full overflow-hidden rounded-2xl border border-black/5 sm:h-72"
      role="region"
      aria-label="Carte des prestataires sélectionnés"
    />
  );
}
