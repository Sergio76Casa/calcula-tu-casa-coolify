"use client";

interface DashboardHeaderProps {
  address: string;
}

export default function DashboardHeader({ address }: DashboardHeaderProps) {
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
        Informe desbloqueado
      </span>
      <h1 className="text-2xl font-extrabold text-white">
        ¡Tu valoración está lista!
      </h1>
      <p className="text-slate-400 text-sm mt-1 truncate">📍 {address}</p>
    </div>
  );
}
