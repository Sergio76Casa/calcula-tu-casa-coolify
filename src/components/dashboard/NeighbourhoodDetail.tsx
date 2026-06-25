"use client";

import type { EntornoData, AnalisisBarrio } from "@/lib/valorar/types";

interface NeighbourhoodDetailProps {
  entorno: EntornoData | null | undefined;
  analisisBarrio: AnalisisBarrio | null | undefined;
}

const CATS = [
  { key: "colegios", label: "Colegios", emoji: "🏫" },
  { key: "supermercados", label: "Supermercados", emoji: "🛒" },
  { key: "farmacias", label: "Farmacias", emoji: "💊" },
  { key: "transporte", label: "Transporte", emoji: "🚇" },
  { key: "parques", label: "Parques", emoji: "🌳" },
  { key: "restaurantes", label: "Restaurantes", emoji: "🍽️" },
  { key: "gasolineras", label: "Gasolineras", emoji: "⛽" },
  { key: "salud", label: "Salud", emoji: "🏥" },
] as const;

export default function NeighbourhoodDetail({
  entorno,
  analisisBarrio,
}: NeighbourhoodDetailProps) {
  if (!entorno && !analisisBarrio) return null;

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          📍 Tu barrio en detalle
        </p>
        {entorno?.origen && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            {entorno.origen === "overpass"
              ? "🛰️ Datos reales OSM"
              : "🤖 Simulación Gemini IA"}
          </span>
        )}
      </div>

      {/* Puntuación de servicios */}
      {analisisBarrio && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-white font-semibold">
              {analisisBarrio.tipo_barrio}
            </span>
            <span
              className={`text-sm font-black ${
                analisisBarrio.puntuacion_servicios >= 7
                  ? "text-emerald-400"
                  : analisisBarrio.puntuacion_servicios >= 5
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            >
              {analisisBarrio.puntuacion_servicios}/10
            </span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all"
              style={{ width: `${analisisBarrio.puntuacion_servicios * 10}%` }}
            />
          </div>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            {analisisBarrio.descripcion}
          </p>
        </div>
      )}

      {/* Grid de servicios */}
      {entorno && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {CATS.map(({ key, label, emoji }) => {
            const pois = entorno[key];
            const first = pois?.[0];
            return (
              <div
                key={key}
                className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center"
              >
                <span className="text-lg block mb-1" aria-hidden>
                  {emoji}
                </span>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
                  {label}
                </p>
                {first ? (
                  <>
                    <p className="text-xs text-white font-medium leading-tight line-clamp-1">
                      {first.nombre || label}
                    </p>
                    <p className="text-[10px] text-emerald-400 mt-0.5">
                      {first.distancia_m < 1000
                        ? `${first.distancia_m}m`
                        : `${(first.distancia_m / 1000).toFixed(1)}km`}
                    </p>
                  </>
                ) : (
                  <p className="text-[10px] text-slate-600">No encontrado</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ventajas de ubicación */}
      {analisisBarrio?.ventajas_ubicacion &&
        analisisBarrio.ventajas_ubicacion.length > 0 && (
          <ul className="space-y-1.5">
            {analisisBarrio.ventajas_ubicacion.map((v, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-slate-300"
              >
                <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                <span>{v}</span>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
}
