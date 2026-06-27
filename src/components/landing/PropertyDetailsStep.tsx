"use client";

import { useState, useEffect } from "react";
import { T, type Lang } from "@/lib/translations";
import { EnergySelector, PillGroup, ToggleOption } from "./FormControls";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type EstadoConservacion  = "a_reformar" | "bueno" | "nuevo";
export type TipoPropiedad       = "piso" | "casa";
export type EnergyCertificate   = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "pending";

export interface PropertyDetails {
  m2: number;
  estado: EstadoConservacion;
  tipo: TipoPropiedad;
  habitaciones: number;
  ascensor?: boolean;
  jardin?: boolean;
  energyCertificate?: EnergyCertificate;
}

interface PropertyDetailsStepProps {
  lang: Lang;
  address: string;
  onCalculate?: (details: PropertyDetails) => void;
  onBack?: () => void;
}

// ─── Datos de opciones ────────────────────────────────────────────────────────

const HAB_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];


// ─── Componente principal ─────────────────────────────────────────────────────

export default function PropertyDetailsStep({ lang, address, onCalculate, onBack }: PropertyDetailsStepProps) {
  const tf = T(lang).form;
  const [m2, setM2]             = useState("");
  const [estado, setEstado]     = useState<EstadoConservacion | null>(null);
  const [tipo, setTipo]         = useState<TipoPropiedad | null>(null);
  const [habitaciones, setHab]  = useState<number | null>(null);
  const [ascensor, setAscensor]     = useState(false);
  const [jardin, setJardin]         = useState(false);
  const [energyCert, setEnergyCert] = useState<EnergyCertificate | null>(null);
  const [errors, setErrors]         = useState<Record<string, string>>({});
  const [estimatedRange, setEstimatedRange] = useState<{ min: number; max: number } | null>(null);

  // Preview de precio estimado mientras rellena
  function calcEstimatedRange(
    sqm: number,
    tipoVal: TipoPropiedad | null,
    estadoVal: EstadoConservacion | null,
    habs: number | null
  ): { min: number; max: number } {
    const BASE_PRICE_M2 = 2500;
    const stateMultiplier = ({ nuevo: 1.2, bueno: 1.0, a_reformar: 0.75 } as Record<string, number>)[estadoVal ?? "bueno"] ?? 1.0;
    const typeMultiplier  = tipoVal === "casa" ? 1.15 : 1.0;
    const habMultiplier   = !habs ? 1 : habs >= 4 ? 1.1 : habs === 1 ? 0.9 : 1.0;
    const base = sqm * BASE_PRICE_M2 * stateMultiplier * typeMultiplier * habMultiplier;
    return {
      min: Math.round(base * 0.85 / 1000) * 1000,
      max: Math.round(base * 1.15 / 1000) * 1000,
    };
  }

  useEffect(() => {
    const num = parseInt(m2);
    if (!isNaN(num) && num >= 20) {
      setEstimatedRange(calcEstimatedRange(num, tipo, estado, habitaciones));
    } else {
      setEstimatedRange(null);
    }
  }, [m2, tipo, estado, habitaciones]);

  const completedFields = [m2 && parseInt(m2) >= 10, tipo, habitaciones, estado].filter(Boolean).length;

  function clearErr(k: string) { setErrors((e) => { const n = { ...e }; delete n[k]; return n; }); }

  function increment() { setM2((p) => String(Math.min(999, (parseInt(p) || 0) + 5))); clearErr("m2"); }
  function decrement() { setM2((p) => String(Math.max(10,  (parseInt(p) || 10) - 5))); clearErr("m2"); }

  function validate(): boolean {
    const next: Record<string, string> = {};
    const num = parseInt(m2);
    if (!m2 || isNaN(num) || num < 10 || num > 999) next.m2   = tf.errors.m2;
    if (!tipo)                                       next.tipo = tf.errors.tipo;
    if (!habitaciones)                               next.hab  = tf.errors.hab;
    if (!estado)                                     next.est  = tf.errors.est;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onCalculate?.({
      m2: parseInt(m2), estado: estado!, tipo: tipo!, habitaciones: habitaciones!,
      ...(tipo === "piso" ? { ascensor } : { jardin }),
      ...(energyCert ? { energyCertificate: energyCert } : {}),
    });
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-16">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-600 rounded-full opacity-15 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-indigo-500 rounded-full opacity-15 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xl">

        {/* Paso */}
        <div className="flex items-center gap-2 mb-7">
          <button onClick={onBack} type="button" className="text-slate-400 hover:text-white text-sm transition-colors">{tf.back}</button>
          <span className="text-slate-600 text-sm ml-auto">{tf.stepIndicator}</span>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-1">
              {[1,2,3,4].map((s) => <span key={s} className={`h-1.5 w-6 rounded-full ${s <= completedFields ? "bg-blue-400" : "bg-slate-700"}`} />)}
            </div>
            <p className="text-xs text-slate-500 text-center mt-1">
              {completedFields === 0 && 'Solo 2 minutos para conocer el valor de tu casa'}
              {completedFields === 1 && '¡Bien! Continúa para ver tu valoración'}
              {completedFields === 2 && '¡Vas muy bien! Ya casi tienes tu valoración'}
              {completedFields === 3 && '¡Casi! Un dato más y estará lista'}
              {completedFields >= 4 && '✓ ¡Perfecto! Estás listo para ver tu precio'}
            </p>
          </div>
        </div>

        {/* Cabecera */}
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3 leading-tight">{tf.title1}<br />{tf.title2}</h2>
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 mb-7">
          <span className="text-slate-400 text-sm">📍</span>
          <span className="text-slate-300 text-sm truncate max-w-xs">{address}</span>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">

          {/* m² */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">{tf.m2Label}</label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={decrement} aria-label="Reducir" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl font-bold hover:bg-white/10 transition-colors active:scale-95 flex-shrink-0">−</button>
              <div className="relative flex-1">
                <input type="text" inputMode="numeric" value={m2} onChange={(e) => { setM2(e.target.value.replace(/\D/g, "")); clearErr("m2"); }}
                  placeholder="90" maxLength={3} aria-label="Metros cuadrados"
                  className="w-full text-center text-3xl font-bold text-white bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-400 transition-colors placeholder-slate-600" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-medium">m²</span>
              </div>
              <button type="button" onClick={increment} aria-label="Aumentar" className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white text-xl font-bold hover:bg-white/10 transition-colors active:scale-95 flex-shrink-0">+</button>
            </div>
            {errors.m2 && <p role="alert" className="mt-2 text-red-400 text-xs">{errors.m2}</p>}
          </div>

          {/* Tipo de propiedad */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">{tf.tipoLabel}</label>
            <PillGroup
              options={tf.tipoOptions as unknown as { value: TipoPropiedad; label: string }[]}
              value={tipo}
              onChange={(v) => { setTipo(v); clearErr("tipo"); }}
              error={errors.tipo}
            />
          </div>

          {/* Habitaciones */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">{tf.habLabel}</label>
            <PillGroup options={HAB_OPTIONS} value={habitaciones} onChange={(v) => { setHab(v); clearErr("hab"); }} error={errors.hab} />
          </div>

          {/* Ascensor / Jardín (condicional) */}
          {tipo === "piso" && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">{tf.ascensorLabel}</label>
              <ToggleOption label={tf.ascensorOpt} emoji="🛗" value={ascensor} onChange={setAscensor} />
            </div>
          )}
          {tipo === "casa" && (
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">{tf.jardinLabel}</label>
              <ToggleOption label={tf.jardinOpt} emoji="🌿" value={jardin} onChange={setJardin} />
            </div>
          )}

          {/* Estado de conservación */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">{tf.estadoLabel}</label>
            <div className="grid grid-cols-3 gap-3">
              {(tf.estadoOptions as unknown as { value: EstadoConservacion; label: string; emoji: string; desc: string }[]).map((opt) => {
                const sel = estado === opt.value;
                return (
                  <button key={opt.value} type="button" onClick={() => { setEstado(opt.value); clearErr("est"); }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 sm:p-4 rounded-xl border-2 transition-all active:scale-[0.97] ${sel ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/10" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"}`}>
                    <span className="text-xl sm:text-2xl" aria-hidden="true">{opt.emoji}</span>
                    <span className={`text-xs sm:text-sm font-bold ${sel ? "text-white" : "text-slate-300"} text-center`}>{opt.label}</span>
                    <span className="text-[9px] min-[380px]:text-xs text-slate-400 text-center leading-tight">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
            {errors.est && <p role="alert" className="mt-2 text-red-400 text-xs">{errors.est}</p>}
          </div>

          {/* Certificado energético */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              {tf.energyLabel}
              <span className="ml-2 text-xs font-normal text-slate-500">(opcional)</span>
            </label>
            <EnergySelector
              value={energyCert}
              pendingLabel={tf.energyPending}
              onChange={setEnergyCert}
            />
          </div>

          {/* Estimación preliminar */}
          {estimatedRange && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Estimación preliminar orientativa</p>
              <p className="text-emerald-400 font-bold text-lg">
                {estimatedRange.min.toLocaleString('es-ES')} — {estimatedRange.max.toLocaleString('es-ES')} €
              </p>
              <p className="text-xs text-slate-500 mt-1">La IA refinará este precio con datos reales del mercado</p>
            </div>
          )}

          <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/30 mt-2">
            {tf.cta}
          </button>

        </form>
      </div>
    </section>
  );
}
