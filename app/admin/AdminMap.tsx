"use client";

import { useEffect, useRef } from "react";
import { T, type Lang } from "@/lib/translations";

interface AdminMapProps {
  pins: { address: string }[];
  lang?: Lang;
}

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ICON_CDN   = "https://unpkg.com/leaflet@1.9.4/dist/images/";

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = `vx_geo:${address}`;
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) return JSON.parse(cached) as { lat: number; lng: number };

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=0&countrycodes=es`;
    const res  = await fetch(url, { headers: { "User-Agent": "CalculaTuCasa/1.0" } });
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data[0]) return null;
    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    sessionStorage.setItem(key, JSON.stringify(result));
    return result;
  } catch {
    return null;
  }
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

export default function AdminMap({ pins, lang = "es" }: AdminMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<unknown>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || pins.length === 0) return;
    let cancelled = false;

    import("leaflet").then(async (L) => {
      if (cancelled || !container) return;

      const IconDefault = L.Icon.Default as unknown as { prototype: { _getIconUrl?: unknown } };
      delete IconDefault.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       ICON_CDN + "marker-icon.png",
        iconRetinaUrl: ICON_CDN + "marker-icon-2x.png",
        shadowUrl:     ICON_CDN + "marker-shadow.png",
      });

      const map = L.map(container, { scrollWheelZoom: true, attributionControl: false });
      L.tileLayer(DARK_TILES, { maxZoom: 18 }).addTo(map);
      L.control.attribution({ prefix: false, position: "bottomright" }).addTo(map);
      map.setView([40.416775, -3.703790], 6); // Spain
      mapRef.current = map;

      const counts: Record<string, number> = {};
      pins.forEach((p) => { counts[p.address] = (counts[p.address] ?? 0) + 1; });
      const unique = Object.keys(counts);

      const t = T(lang).admin.map;

      for (const address of unique) {
        if (cancelled) break;
        const coords = await geocode(address);
        if (cancelled) break;
        if (!coords) { await sleep(1200); continue; }

        const n = counts[address];
        const textPlural = n > 1 ? t.valuations : t.valuation;

        L.marker([coords.lat, coords.lng])
          .addTo(map)
          .bindPopup(
            `<div style="font-size:12px"><b>${address}</b><br/>${n} ${textPlural}</div>`,
            { maxWidth: 240 }
          );

        await sleep(1200);
      }
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
      if (container) container.innerHTML = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins.length, lang]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-2xl border border-white/10"
      style={{ height: "300px", minHeight: "300px" }}
      aria-label="Mapa de valoraciones"
    />
  );
}
