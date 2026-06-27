"use client";

import type { ValuationResult } from "@/components/landing/LoadingValuationStep";
import { T, type Lang } from "@/lib/translations";

interface PriceBannerProps {
  result: ValuationResult;
  m2: number;
  lang?: Lang;
}

function RangeBar({
  min,
  mid,
  max,
  lang,
}: {
  min: number;
  mid: number;
  max: number;
  lang: Lang;
}) {
  const t = T(lang).dashboard.priceBanner;
  const pct = Math.round(((mid - min) / (max - min)) * 100) || 50;
  const labelClamp = Math.max(8, Math.min(80, pct));
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-left">
        {t.range}
      </p>
      <div
        className="relative h-5 bg-white/10 rounded-full mb-1"
        style={{ overflow: "visible" }}
      >
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-700"
          style={{ left: `${pct}%` }}
        >
          <div className="w-8 h-8 rounded-full bg-emerald-400 border-[3px] border-white shadow-[0_0_16px_4px_rgba(52,211,153,0.55)] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
        </div>
      </div>
      <div className="relative h-10">
        <div
          className="absolute -translate-x-1/2 text-center"
          style={{ left: `${labelClamp}%` }}
        >
          <div className="w-px h-3 bg-emerald-400/70 mx-auto" />
          <p
            className="text-emerald-400 font-black text-xs sm:text-sm whitespace-nowrap"
            style={{ textShadow: "0 0 12px rgba(52,211,153,0.7)" }}
          >
            {mid.toLocaleString("es-ES")} €
          </p>
          <p className="text-emerald-400/60 text-[8px] sm:text-[10px] uppercase tracking-wide whitespace-nowrap">
            {t.suggested}
          </p>
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <div className="text-left">
          <p className="text-slate-500">{t.minimum}</p>
          <p className="text-slate-300 font-semibold">
            {min.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">{t.maximum}</p>
          <p className="text-slate-300 font-semibold">
            {max.toLocaleString("es-ES")} €
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PriceBanner({ result, m2, lang = "es" }: PriceBannerProps) {
  const t = T(lang).dashboard.priceBanner;
  const {
    precio_sugerido: mid,
    rango_precios: { minimo: min, maximo: max },
  } = result;

  const pm2 = result.precio_por_m2_zona;
  const alquiler = result.precio_alquiler_estimado;
  const rentabilidad = result.rentabilidad_bruta_pct;
  const tendencia = result.tendencia_mercado_12m;
  const score = result.score_inversion;

  return (
    <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-6 text-center backdrop-blur-sm">
      <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">
        {t.estimated}
      </p>
      <p
        className="text-4xl min-[380px]:text-5xl sm:text-6xl md:text-7xl font-black text-emerald-400 tabular-nums my-3"
        style={{
          textShadow:
            "0 0 25px rgba(52,211,153,0.7), 0 0 60px rgba(52,211,153,0.35)",
        }}
      >
        {mid.toLocaleString("es-ES")} €
      </p>

      {/* Badges de métricas */}
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {pm2 && (
          <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full px-2.5 py-1">
            📐 ~{pm2.toLocaleString("es-ES")} €/m²
          </span>
        )}
        {alquiler && (
          <span className="inline-flex items-center gap-1 text-xs bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full px-2.5 py-1">
            {t.rent.replace("{price}", alquiler.toLocaleString("es-ES"))}
          </span>
        )}
        {rentabilidad !== undefined && rentabilidad !== null && (
          <span
            className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
              rentabilidad >= 5
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
            }`}
          >
            {t.yield.replace("{pct}", rentabilidad.toFixed(1))}
          </span>
        )}
        {score !== undefined && score !== null && (
          <span
            className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
              score >= 7
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : score >= 5
                ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}
          >
            {t.score.replace("{score}", String(score))}
          </span>
        )}
        {tendencia !== undefined && tendencia !== null && (
          <span
            className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
              tendencia > 0
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
            }`}
          >
            {tendencia > 0
              ? t.trendUp.replace("{pct}", Math.abs(tendencia).toFixed(1))
              : t.trendDown.replace("{pct}", Math.abs(tendencia).toFixed(1))}
          </span>
        )}
      </div>

      <p className="text-slate-500 text-xs mb-8">
        {t.calculated}
      </p>
      <RangeBar min={min} mid={mid} max={max} lang={lang} />
    </div>
  );
}
