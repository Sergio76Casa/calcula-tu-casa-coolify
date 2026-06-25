"use client";

import { useEffect, useRef, useState } from "react";
import { T } from "@/lib/translations";
import type { EstadoConservacion, TipoPropiedad, EnergyCertificate } from "./PropertyDetailsStep";
import type { Lang } from "@/lib/translations";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ValuationInput {
  address: string;
  m2: number;
  estado: EstadoConservacion;
  tipo: TipoPropiedad;
  habitaciones: number;
  ascensor?: boolean;
  jardin?: boolean;
  lang?: Lang;
  energyCertificate?: EnergyCertificate;
}

export interface ValuationResult {
  valoracion_id: string;
  propiedad_id: string;
  precio_sugerido: number;
  rango_precios: { minimo: number; maximo: number };
  argumentario_venta: string;
  // Nuevos campos Gemini (opcionales para compatibilidad retroactiva)
  precio_por_m2_zona?: number;
  ajuste_aplicado_pct?: number;
  puntos_fuertes?: string[];
  puntos_a_mejorar?: string[];
  recomendacion_precio_salida?: string;
  precio_alquiler_estimado?: number;
  rentabilidad_bruta_pct?: number;
  tiempo_venta_estimado_dias?: number;
  tendencia_mercado_12m?: number;
  // Entorno y análisis de barrio
  entorno?: Record<string, { nombre: string; distancia_m: number }[]> | null;
  analisis_barrio?: {
    tipo_barrio: string;
    puntuacion_servicios: number;
    descripcion: string;
    ventajas_ubicacion: string[];
  } | null;
  score_inversion?: number;
  coordenadas?: { lat: number; lon: number } | null;
}

interface LoadingValuationStepProps {
  input: ValuationInput;
  onComplete?: (result: ValuationResult) => void;
  onRetry?: () => void;
}

// ─── Subcomponente: Radar animado ─────────────────────────────────────────────

function RadarPulse() {
  return (
    <div className="relative w-40 h-40 mx-auto mb-8" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping"
          style={{ animationDelay: `${i * 0.7}s`, animationDuration: "2.1s", opacity: 0.25 }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-blue-500/40">
          <span className="text-3xl">🏠</span>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LoadingValuationStep({
  input,
  onComplete,
  onRetry,
}: LoadingValuationStepProps) {
  const tl = T(input.lang ?? "es").loading;
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const called = useRef(false);

  // Rotación de mensajes cada 2 s
  useEffect(() => {
    const id = setInterval(
      () => setMsgIndex((i) => (i + 1) % tl.messages.length),
      2000
    );
    return () => clearInterval(id);
  }, [tl.messages.length]);

  // Barra de progreso simulada: 0 → 88% en ~5 s
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 88) { clearInterval(id); return 88; }
        return p + 4;
      });
    }, 220);
    return () => clearInterval(id);
  }, []);

  // Llamada a la API Route de Next.js (una sola vez)
  useEffect(() => {
    if (called.current) return;
    called.current = true;

    async function runValuation() {
      try {
        const res = await fetch("/api/valorar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lang: input.lang ?? "es",
            propiedad: {
              direccion_completa:       input.address,
              m2_construidos:           input.m2,
              estado_conservacion:      input.estado,
              tipo_propiedad:           input.tipo,
              habitaciones:             input.habitaciones,
              ascensor:                 input.ascensor,
              jardin:                   input.jardin,
              certificado_energetico:   input.energyCertificate,
            },
          }),
        });

        if (!res.ok) {
          const detail = await res.json();
          throw new Error(detail?.error || tl.errorMsg);
        }

        const data = (await res.json()) as ValuationResult;
        if (!data?.precio_sugerido) throw new Error(tl.errorMsg);

        setProgress(100);
        setTimeout(() => onComplete?.(data), 600);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : tl.errorMsg);
      }
    }

    runValuation();
  }, [input, onComplete, tl.errorMsg]);

  // ── Estado de error ──
  if (errorMsg) {
    return (
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4" aria-hidden="true">⚠️</p>
          <h2 className="text-xl font-bold text-white mb-2">{tl.errorTitle}</h2>
          <p className="text-slate-400 text-sm mb-6">{errorMsg}</p>
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl transition-colors"
          >
            {tl.retry}
          </button>
        </div>
      </section>
    );
  }

  // ── Estado de carga ──
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4">

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm text-center">

        <RadarPulse />

        <h2 className="text-2xl font-extrabold text-white mb-2">{tl.title}</h2>
        <p className="text-slate-400 text-sm mb-8 truncate px-4">{input.address}</p>

        {/* Mensaje rotativo con contexto dinámico */}
        <div className="h-12 mb-6">
          <p key={msgIndex} className="text-blue-300 text-sm font-medium animate-pulse">
            {typeof tl.messages[msgIndex] === "function" 
              ? (tl.messages[msgIndex] as any)(input.address) 
              : tl.messages[msgIndex]}
          </p>
        </div>

        {/* Barra de progreso */}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <p className="text-slate-500 text-xs mt-2">{progress}%</p>

      </div>
    </section>
  );
}
