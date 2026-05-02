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

export default function MetricsRow({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon="👤"
        label="Total Leads"
        value={String(metrics.total)}
        sub="contactos captados"
        color="text-emerald-400"
      />
      <Card
        icon="📄"
        label="Ratio PDF"
        value={`${metrics.pdfPct}%`}
        sub="descargaron el informe"
        color="text-blue-400"
      />
      <Card
        icon="🧪"
        label="Test A/B"
        value={`A: ${metrics.variantA}%`}
        sub={`B: ${metrics.variantB}%`}
        color="text-purple-400"
      />
      <Card
        icon="📡"
        label="Origen Top"
        value={metrics.topSource}
        sub="fuente con más leads"
        color="text-amber-400"
      />
    </div>
  );
}
