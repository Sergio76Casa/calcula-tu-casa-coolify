"use client";

import { useState } from "react";
import { T, type Lang, type Variant } from "@/lib/translations";
import type { ValuationResult } from "./LoadingValuationStep";
import { PriceTease, Field } from "./FormControls";

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
  prefillName?: string;
  onFinish?: (leadId: string, telefono: string, nombre: string) => void;
  onBack?: () => void;
}

// ─── Consentimiento RGPD ──────────────────────────────────────────────────────

const CONSENT_TEXT: Record<Lang, { before: string; link: string; after: string; error: string; benefit: string }> = {
  es: {
    before: "Acepto que mis datos (nombre, teléfono y datos de la vivienda) se cedan a una inmobiliaria de mi zona para que me contacte sobre la venta. ",
    link: "Política de Privacidad",
    after: "",
    error: "Debes aceptar para poder continuar.",
    benefit: "📞 Una inmobiliaria local podrá llamarte, sin compromiso, para asesorarte sobre la venta.",
  },
  ca: {
    before: "Accepto que les meves dades (nom, telèfon i dades de l'habitatge) es cedeixin a una immobiliària de la meva zona perquè em contacti sobre la venda. ",
    link: "Política de Privacitat",
    after: "",
    error: "Has d'acceptar per poder continuar.",
    benefit: "📞 Una immobiliària local et podrà trucar, sense compromís, per assessorar-te sobre la venda.",
  },
  en: {
    before: "I agree to share my data (name, phone and property details) with a real estate agency in my area so they can contact me about selling. ",
    link: "Privacy Policy",
    after: "",
    error: "You must accept to continue.",
    benefit: "📞 A local agency may call you, with no obligation, to advise you on selling.",
  },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function LeadCaptureStep({
  lang, variant, utmSource = "", utmCampaign = "",
  result, prefillName, onFinish, onBack,
}: LeadCaptureStepProps) {
  const tc = T(lang).capture;
  const consent = CONSENT_TEXT[lang];
  const [form, setForm]         = useState<LeadForm>({ nombre: prefillName || "", telefono: "", email: "" });
  const [accepted, setAccepted] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Testimonios y cuenta atrás eliminados (eran contenido ficticio)

  function validate(f: LeadForm): FormErrors {
    const errs: FormErrors = {};
    if (f.nombre.trim().length < 2)             errs.nombre   = tc.errors.nombre;
    if (!/^\+?[\d\s\-]{9,}$/.test(f.telefono)) errs.telefono = tc.errors.telefono;
    // Email solo se valida si tiene contenido
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs.email = tc.errors.email;
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
    if (!accepted) { setConsentError(true); return; }

    setLoading(true);
    setApiError(null);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propiedad_id: result.propiedad_id,
          nombre:       form.nombre.trim(),
          telefono:     form.telefono.trim(),
          email:        form.email.trim().toLowerCase(),
          test_variant: variant,
          utm_source:   utmSource   || null,
          utm_campaign: utmCampaign || null,
          lang:         lang,
          consentimiento: true,
          consentimiento_texto: `${consent.before}${consent.link}${consent.after}`,
        }),
      });

      setLoading(false);
      if (!res.ok) {
        setApiError(tc.errors.api);
        return;
      }
      
      const data = await res.json();
      if (data.error || !data.lead?.id) {
        setApiError(tc.errors.api);
        return;
      }

      const registeredId = data.lead.id;
      console.log("DEBUG - LeadCaptureStep llamando onFinish:", { leadId: registeredId, tel: form.telefono.trim(), name: form.nombre.trim() });
      onFinish?.(registeredId, form.telefono.trim(), form.nombre.trim());
    } catch (err) {
      setLoading(false);
      setApiError(tc.errors.api);
    }
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

        {/* PriceTease mejorado */}
        <PriceTease result={result} priceReady={tc.priceReady} locked={tc.locked.replace("🔒 ", "")} />

        {/* Beneficio claro (explica para qué se piden los datos) */}
        <p className="text-slate-300 text-xs mb-4 text-center">{consent.benefit}</p>

        <p className="text-slate-400 text-sm mb-4 text-center">{tc.unlockHint}</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label={tc.fields.nombre.label} value={form.nombre}
            placeholder={tc.fields.nombre.placeholder} autoComplete="name"
            error={errors.nombre} onChange={set("nombre")} />

          <Field label={tc.fields.telefono.label} type="tel" value={form.telefono}
            placeholder={tc.fields.telefono.placeholder} autoComplete="tel"
            error={errors.telefono} onChange={set("telefono")} />

          <Field
            label={
              <>
                {tc.fields.email.label}
                <span className="text-xs font-normal text-slate-500 ml-1">(opcional)</span>
              </>
            }
            type="email" value={form.email}
            placeholder={tc.fields.email.placeholder} autoComplete="email"
            error={errors.email} onChange={set("email")} />

          {/* Consentimiento RGPD (obligatorio, no premarcado) */}
          <div>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => { setAccepted(e.target.checked); setConsentError(false); }}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-500"
              />
              <span className="text-xs text-slate-400 leading-relaxed">
                {consent.before}
                <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                  {consent.link}
                </a>
                {consent.after}
              </span>
            </label>
            {consentError && (
              <p role="alert" className="text-red-400 text-xs mt-1.5 px-1">{consent.error}</p>
            )}
          </div>

          {apiError && <p role="alert" className="text-red-400 text-sm px-1">{apiError}</p>}

          {/* CTA mejorado con badges de valor */}
          <div className="mt-2">
            <button type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/30">
              {loading ? tc.ctaLoading : '🔓 Desbloquear mi valoración ahora'}
            </button>
            <div className="flex justify-center gap-3 mt-2">
              <span className="text-xs text-slate-500">📄 PDF 4 páginas</span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">🏘️ Análisis barrio</span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">📈 Rentabilidad</span>
            </div>
          </div>
        </form>

        <p className="text-slate-600 text-xs text-center mt-4">
          <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="underline">{consent.link}</a>
          {" · "}
          <a href="/aviso-legal" target="_blank" rel="noopener noreferrer" className="underline">Aviso legal</a>
        </p>

        {/* Botón WhatsApp alternativo */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-600">o</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <a
          href={`https://wa.me/34602499146?text=${encodeURIComponent('Hola, acabo de valorar mi propiedad en CalculaTuCasa.com y me gustaría recibir el informe PDF completo. ¿Podéis enviármelo por aquí?')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 hover:border-[#25D366]/50 text-[#25D366] font-semibold text-sm rounded-xl transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          ¿Prefieres recibir el informe por WhatsApp?
        </a>

      </div>
    </section>
  );
}
