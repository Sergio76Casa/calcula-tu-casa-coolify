"use client";

import type { EntornoData, AnalisisBarrio } from "@/lib/valorar/types";
import { type Lang } from "@/lib/translations";

interface NeighbourhoodDetailProps {
  entorno: EntornoData | null | undefined;
  analisisBarrio: AnalisisBarrio | null | undefined;
  lang?: Lang;
}

const LOCAL_TX: Record<Lang, {
  title: string;
  realOsm: string;
  simGemini: string;
  notFound: string;
  cats: Record<string, string>;
}> = {
  es: {
    title: "📍 Tu barrio en detalle",
    realOsm: "🛰️ Datos reales OSM",
    simGemini: "🤖 Simulación Gemini IA",
    notFound: "No encontrado",
    cats: {
      colegios: "Colegios",
      supermercados: "Supermercados",
      farmacias: "Farmacias",
      transporte: "Transporte",
      parques: "Parques",
      restaurantes: "Restaurantes",
      gasolineras: "Gasolineras",
      salud: "Salud",
    }
  },
  ca: {
    title: "📍 El teu barri en detall",
    realOsm: "🛰️ Dades reals OSM",
    simGemini: "🤖 Simulació Gemini IA",
    notFound: "No trobat",
    cats: {
      colegios: "Col·legis",
      supermercados: "Supermercats",
      farmacias: "Farmàcies",
      transporte: "Transport",
      parques: "Parcs",
      restaurantes: "Restaurants",
      gasolineras: "Gasolineres",
      salud: "Centres de salut",
    }
  },
  en: {
    title: "📍 Your neighbourhood in detail",
    realOsm: "🛰️ Real OSM Data",
    simGemini: "🤖 Gemini AI Simulation",
    notFound: "Not found",
    cats: {
      colegios: "Schools",
      supermercados: "Supermarkets",
      farmacias: "Pharmacies",
      transporte: "Transport",
      parques: "Parks",
      restaurantes: "Restaurants",
      gasolineras: "Petrol stations",
      salud: "Health centres",
    }
  }
};

const CATS = [
  { key: "colegios", emoji: "🏫" },
  { key: "supermercados", emoji: "🛒" },
  { key: "farmacias", emoji: "💊" },
  { key: "transporte", emoji: "🚇" },
  { key: "parques", emoji: "🌳" },
  { key: "restaurantes", emoji: "🍽️" },
  { key: "gasolineras", emoji: "⛽" },
  { key: "salud", emoji: "🏥" },
] as const;

export default function NeighbourhoodDetail({
  entorno,
  analisisBarrio,
  lang = "es",
}: NeighbourhoodDetailProps) {
  if (!entorno && !analisisBarrio) return null;

  const t = LOCAL_TX[lang];

  return (
    <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {t.title}
        </p>
        {entorno?.origen && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
            {entorno.origen === "overpass"
              ? t.realOsm
              : t.simGemini}
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
          {CATS.map(({ key, emoji }) => {
            const pois = (entorno as any)[key];
            const first = pois?.[0];
            const label = t.cats[key];
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
                  <p className="text-[10px] text-slate-600">{t.notFound}</p>
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
