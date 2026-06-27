"use client";

import { useState } from "react";
import type { ValuationResult } from "./LoadingValuationStep";
import type { PropertyDetails } from "./PropertyDetailsStep";
import EnergyScale from "@/components/EnergyScale";
import { T, type Lang } from "@/lib/translations";
import { U } from "@/lib/uiStrings";
import SellModal from "./SellModal";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import PriceBanner from "@/components/dashboard/PriceBanner";
import HighlightsGrid from "@/components/dashboard/HighlightsGrid";
import NeighbourhoodDetail from "@/components/dashboard/NeighbourhoodDetail";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface ValuationDashboardProps {
  result: ValuationResult;
  details: PropertyDetails;
  address: string;
  lang?: Lang;
  leadId?: string | null;
  telefonoInicial?: string | null;
  leadNombre?: string | null;
  onReset?: () => void;
}

// ─── Helper negrita para marcadores **texto** ─────────────────────────────────

function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-white font-semibold">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

// ─── Clasificador de frases Gemini ────────────────────────────────────────────

const CONCERN_RE =
  /sin ascensor|a reformar|requiere|penaliz|desventaj|sin embargo|aunque/i;
const ENERGY_RE = /energi|certif|emisi|calificaci|co2|eficienci/i;

function classifyGemini(text: string) {
  const sentences = text.split(/\.\s+/).filter((s) => s.trim().length > 12);
  const energy: string[] = [],
    concerns: string[] = [],
    strengths: string[] = [];
  for (const s of sentences) {
    if (ENERGY_RE.test(s)) energy.push(s);
    else if (CONCERN_RE.test(s)) concerns.push(s);
    else strengths.push(s);
  }
  return { strengths, concerns, energy };
}

// ─── Bloque análisis Gemini ───────────────────────────────────────────────────

const G_STYLE = {
  emerald: {
    card: "bg-emerald-500/5 border border-emerald-500/20",
    title: "text-emerald-400",
  },
  amber: {
    card: "bg-amber-500/5 border border-amber-500/20",
    title: "text-amber-400",
  },
  blue: {
    card: "bg-blue-500/5 border border-blue-500/20",
    title: "text-blue-400",
  },
} as const;

// ─── Bloque análisis Gemini Component ─────────────────────────────────────────

function GeminiBlock({
  icon,
  title,
  items,
  theme,
}: {
  icon: string;
  title: string;
  items: string[];
  theme: keyof typeof G_STYLE;
}) {
  if (!items.length) return null;
  const s = G_STYLE[theme];
  return (
    <div className={`${s.card} rounded-2xl p-5`}>
      <p
        className={`text-xs font-bold uppercase tracking-wider mb-4 ${s.title}`}
      >
        {icon} {title}
      </p>
      <ul className="space-y-3">
        {items.map((sentence, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"
          >
            <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
              {icon}
            </span>
            <span>
              <Bold text={sentence.trim().replace(/\.?$/, ".")} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ValuationDashboard({
  result,
  details,
  address,
  lang = "es",
  leadId,
  telefonoInicial,
  leadNombre,
  onReset,
}: ValuationDashboardProps) {
  const { argumentario_venta } = result;
  const { strengths, concerns, energy } = classifyGemini(argumentario_venta);
  const tp = U(lang).pdf;
  const t = T(lang).dashboard;

  const [pdfLoading, setPdfLoading] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  const entorno = result.entorno;
  const analisisB = result.analisis_barrio;

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
        }).catch((err) => {
          console.error("Error marking PDF downloaded:", err);
        });
      }
      await generatePDF(
        result,
        details,
        address,
        lang,
        userName,
        entorno as any,
        analisisB
      );
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <>
      <section className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Encabezado */}
          <DashboardHeader address={address} lang={lang} />

          {/* Precio + rango + métricas */}
          <PriceBanner result={result} m2={details.m2} lang={lang} />

          {/* Puntos fuertes / a considerar (análisis estático) */}
          <HighlightsGrid details={details} lang={lang} />

          {/* Sección Tu Barrio */}
          <NeighbourhoodDetail entorno={entorno as any} analisisBarrio={analisisB} lang={lang} />

          {/* Certificado Energético */}
          <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              ⚡ {T(lang).form.energyLabel}
            </p>
            <EnergyScale cert={details.energyCertificate} />
          </div>

          {/* Análisis Gemini — 3 bloques temáticos */}
          <GeminiBlock
            icon="✅"
            title={t.geminiBlock.strengths}
            items={strengths}
            theme="emerald"
          />
          <GeminiBlock
            icon="⚠️"
            title={t.geminiBlock.concerns}
            items={concerns}
            theme="amber"
          />
          <GeminiBlock
            icon="🌱"
            title={t.geminiBlock.energy}
            items={energy}
            theme="blue"
          />

          {/* Descargar PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="w-full py-4 border-2 border-slate-500/50 hover:border-slate-400 text-slate-300 hover:text-white font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span aria-hidden="true">{pdfLoading ? "⏳" : "📄"}</span>
            {pdfLoading ? t.generatingPdf : tp.btn}
          </button>

          {/* CTA principal — WhatsApp */}
          <a
            href={`https://wa.me/34602499146?text=${encodeURIComponent(
              t.waText.replace("{address}", address)
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 sm:py-5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm sm:text-lg rounded-2xl transition-all duration-200 active:scale-[0.98] shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2.5 text-center leading-tight"
          >
            <span className="text-xl sm:text-2xl" aria-hidden="true">
              🗓
            </span>
            {t.waButton}
          </a>

          {/* CTA secundario — modal venta */}
          <button
            type="button"
            onClick={() => setShowSellModal(true)}
            className="w-full py-4 border-2 border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 font-bold text-base rounded-2xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span aria-hidden="true">💰</span>
            {t.sellButton}
          </button>

          {/* Reset */}
          <p className="text-center pb-4">
            <button
              onClick={onReset}
              className="text-slate-600 hover:text-slate-400 text-xs underline underline-offset-4 transition-colors"
            >
              {t.resetButton}
            </button>
          </p>
        </div>
      </section>

      {showSellModal && (
        <SellModal
          leadId={leadId ?? null}
          telefono_inicial={telefonoInicial ?? null}
          onClose={() => setShowSellModal(false)}
          lang={lang}
        />
      )}
    </>
  );
}
