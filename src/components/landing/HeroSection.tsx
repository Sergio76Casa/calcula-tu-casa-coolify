"use client";

import { useState } from "react";
import { T, type Lang, type Variant } from "@/lib/translations";
import AddressInput from "./AddressInput";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface HeroSectionProps {
  lang:    Lang;
  variant: Variant;
  onNext?: (address: string) => void;
}

// ─── Copy alternativo para variante B ─────────────────────────────────────────

const VARIANT_B: Record<Lang, { title1: string; title2: string; subtitleBold: string; cta: string }> = {
  es: { title1: "¿Cuánto vale realmente",  title2: "tu propiedad hoy?",       subtitleBold: "Análisis IA. Datos reales. Sin rodeos.",  cta: "Descubrir mi precio →" },
  ca: { title1: "Quant val realment",       title2: "la teva propietat avui?", subtitleBold: "Anàlisi IA. Dades reals. Sense voltes.",  cta: "Descobrir el meu preu →" },
  en: { title1: "What is your property",   title2: "really worth today?",     subtitleBold: "AI analysis. Real data. No nonsense.",    cta: "Find my price →" },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function HeroSection({ lang, variant, onNext }: HeroSectionProps) {
  const base = T(lang).hero;
  const b    = variant === "B" ? VARIANT_B[lang] : null;

  const title1       = b?.title1       ?? base.title1;
  const title2       = b?.title2       ?? base.title2;
  const subtitleBold = b?.subtitleBold ?? base.subtitleBold;
  const cta          = b?.cta          ?? base.cta;

  const [address, setAddress] = useState("");
  const [error,   setError]   = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (address.trim().length < 8) { setError(base.addressError); return; }
    setError("");
    onNext?.(address.trim());
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950">

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4  w-96 h-96 bg-blue-600   rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-indigo-500 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-24 text-center">

        {/* Indicador live */}
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-blue-200 text-sm font-medium tracking-wide">{base.badge}</span>
        </div>

        {/* Titular */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] mb-6">
          {title1}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            {title2}
          </span>
        </h1>

        {/* Subtítulo */}
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-4 leading-relaxed">
          {base.subtitle}{" "}
          <span className="text-white font-semibold">{subtitleBold}</span>
        </p>

        {/* Badges */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {base.badges.map((badge) => (
            <span key={badge} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 rounded-full px-3 py-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              {badge}
            </span>
          ))}
        </div>

        {/* Formulario con AddressInput + mapa integrado */}
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto mb-3">
          <div className="p-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <AddressInput
                value={address}
                placeholder={base.placeholder}
                onChange={(v) => { setAddress(v); setError(""); }}
              />
              <button
                type="submit"
                className="whitespace-nowrap self-start px-8 py-4 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-400 hover:to-emerald-400 text-white font-bold text-lg rounded-xl transition-all duration-200 active:scale-[0.97] shadow-lg shadow-blue-500/30 cursor-pointer"
              >
                {cta}
              </button>
            </div>
          </div>
          {error && <p role="alert" className="mt-3 text-red-400 text-sm text-left pl-2">{error}</p>}
        </form>

        {/* Privacidad */}
        <p className="text-slate-500 text-xs mb-16">{base.privacy}</p>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
          {base.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-white">{stat.value}</p>
              <p className="text-slate-400 text-xs mt-1 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
