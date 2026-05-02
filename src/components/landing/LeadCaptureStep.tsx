"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { T, type Lang, type Variant } from "@/lib/translations";
import type { ValuationResult } from "./LoadingValuationStep";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface LeadForm {
  nombre: string;
  telefono: string;
  email: string;
}

interface FormErrors {
  nombre?: string;
  telefono?: string;
  email?: string;
}

interface LeadCaptureStepProps {
  lang: Lang;
  variant: Variant;
  utmSource?: string;
  utmCampaign?: string;
  result: ValuationResult;
  onFinish?: (result: ValuationResult) => void;
  onBack?: () => void;
}

// ─── Subcomponente: gancho visual con precio bloqueado ────────────────────────

function PriceTease({ result, priceReady }: { result: ValuationResult; priceReady: string }) {
  return (
    <div className="mb-6 p-5 bg-white/5 border border-white/10 rounded-2xl text-center">
      <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {priceReady}
      </div>

      {/* Precio desenfocado */}
      <div className="relative inline-block mb-2">
        <p className="text-5xl font-extrabold text-emerald-400 blur-md select-none pointer-events-none" aria-hidden="true">
          {result.precio_sugerido.toLocaleString("es-ES")} €
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1 text-white text-sm font-semibold">
            🔒 Bloqueado
          </span>
        </div>
      </div>

      {/* Rango desenfocado */}
      <p className="text-slate-500 text-xs blur-sm select-none pointer-events-none" aria-hidden="true">
        {result.rango_precios.minimo.toLocaleString("es-ES")} —{" "}
        {result.rango_precios.maximo.toLocaleString("es-ES")} €
      </p>
    </div>
  );
}

// ─── Campo de formulario reutilizable ─────────────────────────────────────────

function Field({
  label, type = "text", value, placeholder, error, autoComplete, onChange,
}: {
  label: string; type?: string; value: string; placeholder: string;
  error?: string; autoComplete?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1.5">{label}</label>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} autoComplete={autoComplete}
        className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 outline-none transition-colors ${
          error ? "border-red-500/60" : "border-white/10 focus:border-blue-400"
        }`}
      />
      {error && <p role="alert" className="mt-1.5 text-red-400 text-xs">{error}</p>}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LeadCaptureStep({
  lang, variant, utmSource = "", utmCampaign = "",
  result, onFinish, onBack,
}: LeadCaptureStepProps) {
  const tc = T(lang).capture;
  const [form, setForm]         = useState<LeadForm>({ nombre: "", telefono: "", email: "" });
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(f: LeadForm): FormErrors {
    const errs: FormErrors = {};
    if (f.nombre.trim().length < 2)               errs.nombre   = tc.errors.nombre;
    if (!/^\+?[\d\s\-]{9,}$/.test(f.telefono))   errs.telefono = tc.errors.telefono;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = tc.errors.email;
    return errs;
  }

  function set(field: keyof LeadForm) {
    return (value: string) => {
      setForm((f) => ({ ...f, [field]: value }));
      setErrors((e) => ({ ...e, [field]: undefined }));
      setApiError(null);
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    setApiError(null);

    const { error } = await supabase.from("leads").insert({
      propiedad_id: result.propiedad_id,
      nombre:       form.nombre.trim(),
      telefono:     form.telefono.trim(),
      email:        form.email.trim().toLowerCase(),
      test_variant: variant,
      utm_source:   utmSource   || null,
      utm_campaign: utmCampaign || null,
      lang:         lang,
    });

    setLoading(false);
    if (error) { setApiError(tc.errors.api); return; }
    onFinish?.(result);
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-20">

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-emerald-600 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-blue-600 rounded-full opacity-10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">

        {/* Indicador de paso */}
        <div className="flex items-center gap-2 mb-8">
          <button onClick={onBack} type="button"
            className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            {tc.back}
          </button>
          <span className="text-slate-600 text-sm ml-auto">{tc.stepIndicator}</span>
          <div className="flex gap-1">
            {[1,2,3,4].map((s) => <span key={s} className="h-1.5 w-6 rounded-full bg-blue-400" />)}
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-2 leading-tight">
          {tc.title1}<br />{tc.title2}
        </h2>
        <p className="text-slate-400 text-sm mb-6">{tc.subtitle}</p>

        <PriceTease result={result} priceReady={tc.priceReady} />
        <p className="text-slate-400 text-sm mb-6 text-center">{tc.unlockHint}</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label={tc.fields.nombre.label} value={form.nombre}
            placeholder={tc.fields.nombre.placeholder} autoComplete="name"
            error={errors.nombre} onChange={set("nombre")} />

          <Field label={tc.fields.telefono.label} type="tel" value={form.telefono}
            placeholder={tc.fields.telefono.placeholder} autoComplete="tel"
            error={errors.telefono} onChange={set("telefono")} />

          <Field label={tc.fields.email.label} type="email" value={form.email}
            placeholder={tc.fields.email.placeholder} autoComplete="email"
            error={errors.email} onChange={set("email")} />

          {apiError && <p role="alert" className="text-red-400 text-sm px-1">{apiError}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/30 mt-2">
            {loading ? tc.ctaLoading : tc.cta}
          </button>
        </form>

        <p className="text-slate-600 text-xs text-center mt-4">{tc.privacy}</p>

      </div>
    </section>
  );
}
