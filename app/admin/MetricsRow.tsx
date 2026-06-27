"use client";

import { T, type Lang } from "@/lib/translations";

export interface Metrics {
  total:     number;
  pdfPct:    number;
  variantA:  number;
  variantB:  number;
  topSource: string;
}

interface CardProps {
  label: string;
  value: string;
  sub?:  string;
  color?: string;
  icon:  string;
}

function Card({ label, value, sub, color = "text-white", icon }: CardProps) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
        <span className="text-lg" aria-hidden="true">{icon}</span>
      </div>
      <p className={`text-3xl font-black tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs">{sub}</p>}
    </div>
  );
}

export default function MetricsRow({ 
  metrics, 
  abMode = "random", 
  onModeChange,
  lang = "es"
}: { 
  metrics: Metrics;
  abMode?: string;
  onModeChange?: (mode: string) => void;
  lang?: Lang;
}) {
  const t = T(lang).admin.metrics;
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon="👤"
        label={t.totalLeads}
        value={String(metrics.total)}
        sub={t.totalLeadsSub}
        color="text-emerald-400"
      />
      <Card
        icon="📄"
        label={t.ratioPdf}
        value={`${metrics.pdfPct}%`}
        sub={t.ratioPdfSub}
        color="text-blue-400"
      />
      
      {/* Casilla Test A/B Interactiva */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t.testAb}</p>
          <div className="flex gap-2">
            <a href="/?v=A" target="_blank" className="text-[10px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded border border-white/10 text-slate-400 transition-colors">{t.viewA}</a>
            <a href="/?v=B" target="_blank" className="text-[10px] bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded border border-white/10 text-slate-400 transition-colors">{t.viewB}</a>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black tabular-nums text-purple-400">A: {metrics.variantA}%</p>
            <p className="text-slate-500 text-[10px]">B: {metrics.variantB}%</p>
          </div>
          <select 
            value={abMode}
            onChange={(e) => onModeChange?.(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg text-[10px] px-2 py-1 text-white outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="random">{t.autoMode}</option>
            <option value="A">{t.fixA}</option>
            <option value="B">{t.fixB}</option>
          </select>
        </div>
      </div>

      <Card
        icon="📡"
        label={t.topSource}
        value={metrics.topSource}
        sub={t.topSourceSub}
        color="text-amber-400"
      />
    </div>
  );
}
