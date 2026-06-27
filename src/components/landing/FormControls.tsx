"use client";

import type { EnergyCertificate } from "./PropertyDetailsStep";
import type { ValuationResult } from "./LoadingValuationStep";

// ─── Colores EU para certificados energéticos ─────────────────────────────────

export const ENERGY_CERTS = ["A", "B", "C", "D", "E", "F", "G"] as const;
export const ENERGY_BG: Record<string, string> = {
  A: "#166534",
  B: "#15803d",
  C: "#4d7c0f",
  D: "#a16207",
  E: "#9a3412",
  F: "#b91c1c",
  G: "#7f1d1d",
};

// ─── Subcomponente: selector certificado energético ──────────────────────────

export function EnergySelector({
  value,
  pendingLabel,
  onChange,
}: {
  value: EnergyCertificate | null;
  pendingLabel: string;
  onChange: (v: EnergyCertificate) => void;
}) {
  const opts: EnergyCertificate[] = [...ENERGY_CERTS, "pending"];
  return (
    <div className="flex flex-wrap gap-1.5">
      {opts.map((cert) => {
        const sel = value === cert;
        const colored = sel && cert !== "pending";
        return (
          <button
            key={cert}
            type="button"
            onClick={() => onChange(cert)}
            style={
              colored
                ? { backgroundColor: ENERGY_BG[cert], borderColor: ENERGY_BG[cert] }
                : undefined
            }
            className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg border-2 text-xs sm:text-sm font-bold transition-all active:scale-95 ${
              sel
                ? cert === "pending"
                  ? "border-blue-400 bg-blue-500/20 text-white"
                  : "text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
            }`}
          >
            {cert === "pending" ? pendingLabel : cert}
          </button>
        );
      })}
    </div>
  );
}

// ─── Subcomponente: selector de pastillas ─────────────────────────────────────

export function PillGroup<T extends string | number>({
  options,
  value,
  onChange,
  error,
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
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all active:scale-95 ${
              value === o.value
                ? "border-blue-400 bg-blue-500/20 text-white shadow-md shadow-blue-500/10"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/25"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-red-400 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Subcomponente: interruptor (toggle) ──────────────────────────────────────

export function ToggleOption({
  label,
  emoji,
  value,
  onChange,
}: {
  label: string;
  emoji: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between w-full px-4 py-3.5 rounded-xl border-2 transition-all ${
        value
          ? "border-blue-400 bg-blue-500/20"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="text-lg" aria-hidden="true">
          {emoji}
        </span>
        <span className="text-sm font-semibold text-white">{label}</span>
      </span>
      <span
        className={`relative w-10 h-5 rounded-full transition-colors ${
          value ? "bg-blue-400" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${
            value ? "left-5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}

// ─── Subcomponente: gancho visual con precio bloqueado ────────────────────────

export function PriceTease({
  result,
  priceReady,
  locked,
}: {
  result: ValuationResult;
  priceReady: string;
  locked: string;
}) {
  const digitMask = result.precio_sugerido
    .toLocaleString("es-ES")
    .replace(/\d/g, "●");

  return (
    <div className="mb-6 p-5 bg-white/5 border border-white/10 rounded-2xl">
      <div className="text-center mb-3">
        <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {priceReady}
        </div>

        {/* Precio borroso con overlay */}
        <div className="relative inline-block mb-2">
          <p className="text-4xl font-extrabold text-emerald-400 blur-md select-none" aria-hidden="true">
            {result.precio_sugerido.toLocaleString("es-ES")} €
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 text-white text-sm font-semibold">🔒 {locked}</span>
          </div>
        </div>

        {/* Número de cifras */}
        <p className="text-slate-400 text-sm">
          Tu valoración: <span className="text-white font-mono font-bold tracking-widest">{digitMask} €</span>
        </p>
      </div>

      {/* Rango visible SIN blur */}
      <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-3">
        <div className="text-center">
          <p className="text-xs text-slate-500">Mínimo</p>
          <p className="text-slate-300 font-semibold text-sm">{result.rango_precios.minimo.toLocaleString("es-ES")} €</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Precio exacto</p>
          <p className="text-white font-bold">🔒 Bloqueado</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-500">Máximo</p>
          <p className="text-slate-300 font-semibold text-sm">{result.rango_precios.maximo.toLocaleString("es-ES")} €</p>
        </div>
      </div>
    </div>
  );
}

// ─── Campo de formulario reutilizable ─────────────────────────────────────────

export function Field({
  label,
  type = "text",
  value,
  placeholder,
  error,
  autoComplete,
  onChange,
}: {
  label: React.ReactNode;
  type?: string;
  value: string;
  placeholder: string;
  error?: string;
  autoComplete?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 outline-none transition-colors ${
          error ? "border-red-500/60" : "border-white/10 focus:border-blue-400"
        }`}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-red-400 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
