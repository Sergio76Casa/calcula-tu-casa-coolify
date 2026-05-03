"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  leadId:           string | null;
  telefono_inicial: string | null;
  onClose:          () => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const URGENCIA_OPTS = [
  { v: "menos_3_meses", label: "Menos de 3 meses", icon: "🔥", sub: "Venta urgente"  },
  { v: "3_6_meses",     label: "3 – 6 meses",      icon: "📅", sub: "Con margen"     },
  { v: "solo_info",     label: "Solo información",  icon: "💡", sub: "Sin compromiso" },
];

const ESTADO_OPTS = [
  { v: "original",   label: "Original",   icon: "🏛", sub: "Sin reformar"     },
  { v: "reformada",  label: "Reformada",  icon: "✨", sub: "En perfecto estado" },
  { v: "a_reformar", label: "A reformar", icon: "🔨", sub: "Requiere obras"    },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function OptionCard({ icon, label, sub, selected, onClick }: {
  icon: string; label: string; sub: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
        selected
          ? "border-emerald-400 bg-emerald-400/10"
          : "border-white/10 bg-white/5 hover:border-white/30"
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${selected ? "text-emerald-400" : "text-white"}`}>{label}</p>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
      {selected && <span className="text-emerald-400 text-lg flex-shrink-0">✓</span>}
    </button>
  );
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex gap-2 justify-center mb-6">
      {[1, 2, 3].map(s => (
        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${
          s === step ? "w-6 bg-emerald-400" : s < step ? "w-4 bg-emerald-400/50" : "w-4 bg-white/20"
        }`} />
      ))}
    </div>
  );
}

const TITLES = ["¿Cuándo quieres vender?", "Estado de la vivienda", "Confirma tu contacto"];

// ─── Main component ───────────────────────────────────────────────────────────

export default function SellModal({ leadId, telefono_inicial, onClose }: Props) {
  const [step,     setStep]     = useState<1 | 2 | 3>(1);
  const [urgencia, setUrgencia] = useState("");
  const [estado,   setEstado]   = useState("");
  const [telefono, setTelefono] = useState(telefono_inicial || "");
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  
  console.log("DEBUG - SellModal render:", { leadId, telefono_inicial, telefono });
  
  const hasInitialPhone = !!(telefono_inicial && telefono_inicial.trim().length > 0);

  async function handleSubmit() {
    if (!telefono.trim()) { setError("Introduce tu teléfono de contacto"); return; }
    setSaving(true);
    setError(null);
    if (leadId) {
      const { error: err } = await supabase
        .from("leads")
        .update({ 
          quiere_vender:  true, 
          venta_urgencia: urgencia, 
          venta_estado:   estado, 
          telefono_final: telefono.trim() 
        })
        .eq("id", leadId);
      if (err) { setError("No se pudo guardar. Inténtalo de nuevo."); setSaving(false); return; }
    }
    setSaving(false);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-bold text-white">
            {done ? "¡Todo listo!" : TITLES[step - 1]}
          </h2>
          <button onClick={onClose} aria-label="Cerrar"
            className="text-slate-500 hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        {/* ── Success ────────────────────────────────────────────────────────── */}
        {done ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400/50 flex items-center justify-center mx-auto animate-pulse">
              <span className="text-3xl">✅</span>
            </div>
            <p className="text-white font-bold text-lg">¡Solicitud enviada!</p>
            <p className="text-slate-400 text-sm">Un experto se pondrá en contacto contigo en las próximas horas para coordinar tu venta.</p>
            <button onClick={onClose}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl transition-colors">
              Perfecto, gracias
            </button>
          </div>
        ) : (
          <>
            <StepDots step={step} />

            {/* ── Step 1 ─────────────────────────────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-3">
                {URGENCIA_OPTS.map(o => (
                  <OptionCard key={o.v} icon={o.icon} label={o.label} sub={o.sub}
                    selected={urgencia === o.v} onClick={() => setUrgencia(o.v)} />
                ))}
                <button type="button" disabled={!urgencia} onClick={() => setStep(2)}
                  className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-colors">
                  Siguiente →
                </button>
              </div>
            )}

            {/* ── Step 2 ─────────────────────────────────────────────────────── */}
            {step === 2 && (
              <div className="space-y-3">
                {ESTADO_OPTS.map(o => (
                  <OptionCard key={o.v} icon={o.icon} label={o.label} sub={o.sub}
                    selected={estado === o.v} onClick={() => setEstado(o.v)} />
                ))}
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white rounded-xl transition-colors text-sm">
                    ← Atrás
                  </button>
                  <button type="button" disabled={!estado} onClick={() => setStep(3)}
                    className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-colors">
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3 ─────────────────────────────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-4">
                {hasInitialPhone ? (
                  <div className="bg-emerald-400/5 border border-emerald-400/20 rounded-xl p-4 text-center">
                    <p className="text-white text-sm font-medium mb-1">¡Perfecto!</p>
                    <p className="text-slate-400 text-xs">
                      Usaremos tu teléfono <span className="text-emerald-400 font-bold">{telefono_inicial}</span> para contactarte y coordinar la visita.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-400 text-sm">Confirma el teléfono al que llamarte para coordinar la visita de valoración.</p>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={e => { setTelefono(e.target.value); setError(null); }}
                      placeholder="+34 600 000 000"
                      className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  </>
                )}
                
                {error && <p className="text-red-400 text-xs">{error}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => setStep(2)}
                    className="flex-1 py-3 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white rounded-xl transition-colors text-sm">
                    ← Atrás
                  </button>
                  <button type="button" onClick={handleSubmit} disabled={saving}
                    className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-colors">
                    {saving ? "Enviando..." : (hasInitialPhone ? "Confirmar y enviar" : "Quiero vender 🚀")}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
