"use client";

import { useEffect, useRef } from "react";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface MapPreviewProps {
  lat:     number;
  lng:     number;
  address: string;
}

// CDN tiles for dark themed map (CartoDB Dark Matter)
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>';

const ICON_CDN = "https://unpkg.com/leaflet@1.9.4/dist/images/";

// ─── Componente ───────────────────────────────────────────────────────────────

export default function MapPreview({ lat, lng, address }: MapPreviewProps) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    // Remove previous instance if coords changed
    if (mapInstanceRef.current) {
      (mapInstanceRef.current as { remove: () => void }).remove();
      mapInstanceRef.current = null;
      container.innerHTML = "";
    }

    import("leaflet").then((L) => {
      if (cancelled || !container) return;

      // Fix default marker icons (webpack asset issue)
      const Icon = L.Icon.Default as unknown as { prototype: { _getIconUrl?: unknown } };
      delete Icon.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       ICON_CDN + "marker-icon.png",
        iconRetinaUrl: ICON_CDN + "marker-icon-2x.png",
        shadowUrl:     ICON_CDN + "marker-shadow.png",
      });

      const map = L.map(container, {
        scrollWheelZoom: false,
        zoomControl:     true,
        attributionControl: false,
      });

      L.tileLayer(DARK_TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(map);
      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);

      map.setView([lat, lng], 16);

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(`<b style="font-size:12px">${address}</b>`, { maxWidth: 200 })
        .openPopup();

      mapInstanceRef.current = map;
    });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, address]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-2xl"
      style={{ minHeight: "200px" }}
      aria-label={`Mapa mostrando ${address}`}
    />
  );
}
