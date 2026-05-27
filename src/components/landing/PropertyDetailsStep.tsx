"use client";

import { useState } from "react";
import { T, type Lang } from "@/lib/translations";

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

// ─── Colores EU para certificados energéticos ─────────────────────────────────

const ENERGY_CERTS = ["A","B","C","D","E","F","G"] as const;
const ENERGY_BG: Record<string, string> = {
  A:"#166534", B:"#15803d", C:"#4d7c0f", D:"#a16207", E:"#9a3412", F:"#b91c1c", G:"#7f1d1d",
};

// ─── Datos de opciones ────────────────────────────────────────────────────────

const HAB_OPTIONS = [
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4+" },
];

// ─── Subcomponente: selector certificado energético ──────────────────────────

function EnergySelector({ value, pendingLabel, onChange }: {
  value: EnergyCertificate | null;
  pendingLabel: string;
  onChange: (v: EnergyCertificate) => void;
}) {
  const opts: EnergyCertificate[] = [...ENERGY_CERTS, "pending"];
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((cert) => {
        const sel     = value === cert;
        const colored = sel && cert !== "pending";
        return (
          <button key={cert} type="button" onClick={() => onChange(cert)}
            style={colored ? { backgroundColor: ENERGY_BG[cert], borderColor: ENERGY_BG[cert] } : undefined}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border-2 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
              sel
                ? cert === "pending"
                  ? "border-blue-400 bg-blue-500/20 text-white"
                  : "text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
            }`}>
            {cert === "pending" ? pendingLabel : cert}
          </button>
        );
      })}
    </div>
  );
}

// ─── Subcomponente: selector de pastillas ─────────────────────────────────────

function PillGroup<T extends string | number>({
  options, value, onChange, error,
}: {
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={String(o.value)} type="button" onClick={() => onChange(o.value)}
            className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all active:scale-95 ${
              value === o.value
                ? "border-blue-400 bg-blue-500/20 text-white shadow-md shadow-blue-500/10"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
            }`}>
            {o.label}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── Subcomponente: interruptor (toggle) ──────────────────────────────────────

function ToggleOption({ label, emoji, value, onChange }: {
  label: string; emoji: string; value: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border-2 transition-all ${
        value ? "border-blue-400 bg-blue-500/20" : "border-white/10 bg-white/5 hover:border-white/20"
      }`}>
      <span className="flex items-center gap-3">
        <span className="text-lg" aria-hidden="true">{emoji}</span>
        <span className="text-sm font-semibold text-white">{label}</span>
      </span>
      <span className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-blue-400" : "bg-white/20"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${value ? "left-5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

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
          <div className="flex gap-1">
            {[1,2,3,4].map((s) => <span key={s} className={`h-1.5 w-6 rounded-full ${s <= 2 ? "bg-blue-400" : "bg-slate-700"}`} />)}
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

          <button type="submit" className="w-full py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/30 mt-2">
            {tf.cta}
          </button>

        </form>
      </div>
    </section>
  );
}
