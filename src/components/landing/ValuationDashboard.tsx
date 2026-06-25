"use client";

import { useState } from "react";
import type { ValuationResult } from "./LoadingValuationStep";
import type { PropertyDetails } from "./PropertyDetailsStep";
import EnergyScale             from "@/components/EnergyScale";
import { U }           from "@/lib/uiStrings";
import type { Lang }   from "@/lib/translations";
import SellModal        from "./SellModal";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ValuationDashboardProps {
  result:   ValuationResult;
  details:  PropertyDetails;
  address:  string;
  lang?:    Lang;
  leadId?:  string | null;
  telefonoInicial?: string | null;
  leadNombre?:      string | null;
  onReset?: () => void;
}
interface Highlight { icon: string; text: string }

// ─── Helper negrita para marcadores **texto** ─────────────────────────────────

function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => i % 2 === 1
    ? <strong key={i} className="text-white font-semibold">{p}</strong>
    : <span key={i}>{p}</span>
  )}</>;
}

// ─── Clasificador de frases Gemini ────────────────────────────────────────────

const CONCERN_RE = /sin ascensor|a reformar|requiere|penaliz|desventaj|sin embargo|aunque/i;
const ENERGY_RE  = /energi|certif|emisi|calificaci|co2|eficienci/i;

function classifyGemini(text: string) {
  const sentences = text.split(/\.\s+/).filter(s => s.trim().length > 12);
  const energy: string[] = [], concerns: string[] = [], strengths: string[] = [];
  for (const s of sentences) {
    if      (ENERGY_RE.test(s))  energy.push(s);
    else if (CONCERN_RE.test(s)) concerns.push(s);
    else                         strengths.push(s);
  }
  return { strengths, concerns, energy };
}

// ─── Bloque análisis Gemini ───────────────────────────────────────────────────

const G_STYLE = {
  emerald: { card: "bg-emerald-500/5 border border-emerald-500/20", title: "text-emerald-400" },
  amber:   { card: "bg-amber-500/5 border border-amber-500/20",     title: "text-amber-400"   },
  blue:    { card: "bg-blue-500/5 border border-blue-500/20",       title: "text-blue-400"    },
} as const;

function GeminiBlock({ icon, title, items, theme }: {
  icon: string; title: string; items: string[]; theme: keyof typeof G_STYLE;
}) {
  if (!items.length) return null;
  const s = G_STYLE[theme];
  return (
    <div className={`${s.card} rounded-2xl p-5`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${s.title}`}>{icon} {title}</p>
      <ul className="space-y-3">
        {items.map((sentence, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
            <span className="flex-shrink-0 mt-0.5">{icon}</span>
            <span><Bold text={sentence.trim().replace(/\.?$/, ".")} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Puntos fuertes / a mejorar (estáticos) ───────────────────────────────────

function getHighlights(d: PropertyDetails): { pros: Highlight[]; cons: Highlight[] } {
  const pros: Highlight[] = [], cons: Highlight[] = [];
  if      (d.estado === "nuevo") pros.push({ icon:"✨", text:"Propiedad **completamente reformada** — máximo atractivo" });
  else if (d.estado === "bueno") pros.push({ icon:"✅", text:"**Buen estado** de conservación — lista para entrar a vivir" });
  else                           cons.push({ icon:"🔨", text:"Requiere **reforma integral** — reduce el precio de entrada" });

  const hab = d.habitaciones >= 4 ? "4+" : String(d.habitaciones);
  if (d.habitaciones >= 3) pros.push({ icon:"🛏", text:`**${hab} habitaciones** — distribución muy demandada` });
  else                     cons.push({ icon:"📦", text:`**${hab} habitación** — mercado objetivo más reducido` });

  if (d.m2 >= 80)     pros.push({ icon:"📐", text:`**${d.m2} m²** construidos — superficie especialmente valorada` });
  else if (d.m2 < 55) cons.push({ icon:"📐", text:`**${d.m2} m²** — superficie ajustada respecto a la media` });

  if (d.tipo === "piso") {
    if (d.ascensor) pros.push({ icon:"🛗", text:"**Con ascensor** — añade entre un 5 y 8% de valor" });
    else            cons.push({ icon:"⚠️", text:"**Sin ascensor** — puede penalizar hasta un 8% el precio" });
  }
  if (d.tipo === "casa") {
    if (d.jardin) pros.push({ icon:"🌿", text:"**Jardín o parcela** — incrementa el valor un 10–25%" });
    else          cons.push({ icon:"🏡", text:"Sin jardín — **recorrido de mejora** en tipología casa" });
  }
  return { pros, cons };
}

// ─── Barra rango de mercado ───────────────────────────────────────────────────

function RangeBar({ min, mid, max }: { min: number; mid: number; max: number }) {
  const pct        = Math.round(((mid - min) / (max - min)) * 100);
  const labelClamp = Math.max(8, Math.min(80, pct));
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">📊 Rango de mercado</p>
      <div className="relative h-5 bg-white/10 rounded-full mb-1" style={{ overflow: "visible" }}>
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-700"
          style={{ left: `${pct}%` }}>
          <div className="w-8 h-8 rounded-full bg-emerald-400 border-[3px] border-white shadow-[0_0_16px_4px_rgba(52,211,153,0.55)] flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white" />
          </div>
        </div>
      </div>
      <div className="relative h-10">
        <div className="absolute -translate-x-1/2 text-center" style={{ left: `${labelClamp}%` }}>
          <div className="w-px h-3 bg-emerald-400/70 mx-auto" />
          <p className="text-emerald-400 font-black text-xs sm:text-sm whitespace-nowrap"
            style={{ textShadow: "0 0 12px rgba(52,211,153,0.7)" }}>
            {mid.toLocaleString("es-ES")} €
          </p>
          <p className="text-emerald-400/60 text-[8px] sm:text-[10px] uppercase tracking-wide whitespace-nowrap">Precio sugerido</p>
        </div>
      </div>
      <div className="flex justify-between text-xs mt-1">
        <div><p className="text-slate-500">Mínimo</p><p className="text-slate-300 font-semibold">{min.toLocaleString("es-ES")} €</p></div>
        <div className="text-right"><p className="text-slate-500">Máximo</p><p className="text-slate-300 font-semibold">{max.toLocaleString("es-ES")} €</p></div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ValuationDashboard({ 
  result, details, address, lang = "es", leadId, telefonoInicial, leadNombre, onReset 
}: ValuationDashboardProps) {
  const { precio_sugerido: mid, rango_precios: { minimo: min, maximo: max }, argumentario_venta } = result;
  const { pros, cons }                   = getHighlights(details);
  const { strengths, concerns, energy }  = classifyGemini(argumentario_venta);
  const tp = U(lang).pdf;

  const [pdfLoading,    setPdfLoading]    = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  // Métricas nuevas con fallbacks seguros
  const pm2           = result.precio_por_m2_zona;
  const alquiler      = result.precio_alquiler_estimado;
  const rentabilidad  = result.rentabilidad_bruta_pct;
  const tendencia     = result.tendencia_mercado_12m;
  const score         = result.score_inversion;
  const entorno       = result.entorno;
  const analisisB     = result.analisis_barrio;

  // Categorías del entorno con emojis y etiquetas
  const CATS = [
    { key: "colegios",      label: "Colegios",     emoji: "🏫" },
    { key: "supermercados", label: "Supermercados", emoji: "🛒" },
    { key: "farmacias",     label: "Farmacias",     emoji: "💊" },
    { key: "transporte",    label: "Transporte",    emoji: "🚇" },
    { key: "parques",       label: "Parques",       emoji: "🌳" },
    { key: "restaurantes",  label: "Restaurantes",  emoji: "🍽️" },
    { key: "gasolineras",   label: "Gasolineras",   emoji: "⛽" },
    { key: "salud",         label: "Salud",         emoji: "🏥" },
  ] as const;

  async function handleDownloadPDF() {
    setPdfLoading(true);
    try {
      const { generatePDF } = await import("@/lib/generatePDF");
      const userName = leadNombre || null;
      if (leadId) {
        fetch("/api/lead", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, action: "download" }),
        }).catch((err) => { console.error("Error marking PDF downloaded:", err); });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await generatePDF(result, details, address, lang, userName, entorno as any, analisisB ?? null);
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <>
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Encabezado */}
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Informe desbloqueado
          </span>
          <h1 className="text-2xl font-extrabold text-white">¡Tu valoración está lista!</h1>
          <p className="text-slate-400 text-sm mt-1 truncate">📍 {address}</p>
        </div>

        {/* Precio + rango + métricas */}
        <div className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-6 text-center backdrop-blur-sm">
          <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Valor de mercado estimado</p>
          <p className="text-4xl min-[380px]:text-5xl sm:text-6xl md:text-7xl font-black text-emerald-400 tabular-nums my-3"
            style={{ textShadow: "0 0 25px rgba(52,211,153,0.7), 0 0 60px rgba(52,211,153,0.35)" }}>
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
                🏠 Alquiler ~{alquiler.toLocaleString("es-ES")} €/mes
              </span>
            )}
            {rentabilidad && (
              <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
                rentabilidad >= 5
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
              }`}>
                📈 Rentab. {rentabilidad.toFixed(1)}%
              </span>
            )}
            {score !== undefined && (
              <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
                score >= 7 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                : score >= 5 ? "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                : "bg-red-500/10 border border-red-500/20 text-red-300"
              }`}>
                ⭐ Score inversión: {score}/10
              </span>
            )}
            {tendencia !== undefined && (
              <span className={`inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-1 ${
                tendencia > 0
                  ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                  : "bg-red-500/10 border border-red-500/20 text-red-300"
              }`}>
                {tendencia > 0 ? "↑" : "↓"} {Math.abs(tendencia).toFixed(1)}% en 12 meses
              </span>
            )}
          </div>

          <p className="text-slate-500 text-xs mb-8">Calculado con Gemini 2.5 Flash · datos reales del mercado</p>
          <RangeBar min={min} mid={mid} max={max} />
        </div>

        {/* Puntos fuertes / a considerar (análisis estático) */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">✅ Puntos fuertes</p>
            <ul className="space-y-3">
              {pros.length > 0 ? pros.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-snug">
                  <span className="flex-shrink-0 mt-0.5">{p.icon}</span>
                  <span><Bold text={p.text} /></span>
                </li>
              )) : <li className="text-slate-500 text-sm">Sin puntos destacados.</li>}
            </ul>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">⚠️ Puntos a considerar</p>
            <ul className="space-y-3">
              {cons.length > 0 ? cons.map((c, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 leading-snug">
                  <span className="flex-shrink-0 mt-0.5">{c.icon}</span>
                  <span><Bold text={c.text} /></span>
                </li>
              )) : <li className="text-slate-500 text-sm">Sin puntos a mejorar.</li>}
            </ul>
          </div>
        </div>

        {/* Sección Tu Barrio */}
        {(entorno || analisisB) && (
          <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">📍 Tu barrio en detalle</p>

            {/* Puntuación de servicios */}
            {analisisB && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white font-semibold">{analisisB.tipo_barrio}</span>
                  <span className={`text-sm font-black ${
                    analisisB.puntuacion_servicios >= 7 ? "text-emerald-400"
                    : analisisB.puntuacion_servicios >= 5 ? "text-amber-400"
                    : "text-red-400"
                  }`}>{analisisB.puntuacion_servicios}/10</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${analisisB.puntuacion_servicios * 10}%` }}
                  />
                </div>
                <p className="text-slate-400 text-xs mt-2 leading-relaxed">{analisisB.descripcion}</p>
              </div>
            )}

            {/* Grid de servicios */}
            {entorno && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                {CATS.map(({ key, label, emoji }) => {
                  const pois = (entorno as Record<string, { nombre: string; distancia_m: number }[]>)[key];
                  const first = pois?.[0];
                  return (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                      <span className="text-lg block mb-1" aria-hidden>{emoji}</span>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                      {first ? (
                        <>
                          <p className="text-xs text-white font-medium leading-tight line-clamp-1">{first.nombre || label}</p>
                          <p className="text-[10px] text-emerald-400 mt-0.5">{first.distancia_m < 1000 ? `${first.distancia_m}m` : `${(first.distancia_m/1000).toFixed(1)}km`}</p>
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
            {(() => {
              const ventajas = analisisB?.ventajas_ubicacion;
              if (!ventajas || ventajas.length === 0 || !analisisB) return null;
              return (
                <ul className="space-y-1.5">
                  {ventajas.map((v, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 flex-shrink-0 mt-0.5">✓</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        )}

        {/* Certificado Energético */}
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">⚡ Certificado Energético</p>
          <EnergyScale cert={details.energyCertificate} />
        </div>

        {/* Análisis Gemini — 3 bloques temáticos */}
        <GeminiBlock icon="✅" title="Puntos Fuertes · Gemini IA"       items={strengths} theme="emerald" />
        <GeminiBlock icon="⚠️" title="Puntos a Considerar · Gemini IA"  items={concerns}  theme="amber"   />
        <GeminiBlock icon="🌱" title="Análisis Energético · Gemini IA"  items={energy}    theme="blue"    />

        {/* Descargar PDF */}
        <button type="button" onClick={handleDownloadPDF} disabled={pdfLoading}
          className="w-full py-4 border-2 border-slate-500/50 hover:border-slate-400 text-slate-300 hover:text-white font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50">
          <span aria-hidden="true">{pdfLoading ? "⏳" : "📄"}</span>
          {pdfLoading ? "Generando PDF..." : tp.btn}
        </button>

        {/* CTA principal — WhatsApp */}
        <a
          href={`https://wa.me/34602499146?text=${encodeURIComponent(
            `Hola, acabo de valorar mi propiedad en CalculaTuCasa.com y me gustaría solicitar una visita para una valoración física profesional. La dirección es: ${address}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 sm:py-5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm sm:text-lg rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 text-center leading-tight">
          <span className="text-xl sm:text-2xl" aria-hidden="true">🗓</span>
          Solicitar visita de confirmación con un experto
        </a>

        {/* CTA secundario — modal venta */}
        <button type="button"
          onClick={() => setShowSellModal(true)}
          className="w-full py-4 border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2">
          <span aria-hidden="true">💰</span>
          Quiero vender por este precio
        </button>

        {/* Reset */}
        <p className="text-center pb-4">
          <button onClick={onReset}
            className="text-slate-600 hover:text-slate-400 text-xs underline underline-offset-4 transition-colors">
            Valorar otra propiedad
          </button>
        </p>

      </div>
    </section>

    {showSellModal && (
      <SellModal 
        leadId={leadId ?? null} 
        telefono_inicial={telefonoInicial ?? null}
        onClose={() => setShowSellModal(false)} 
      />
    )}
    </>
  );
}
