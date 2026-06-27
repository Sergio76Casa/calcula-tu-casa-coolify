"use client";

import { T, type Lang } from "@/lib/translations";

interface DashboardHeaderProps {
  address: string;
  lang?: Lang;
}

export default function DashboardHeader({ address, lang = "es" }: DashboardHeaderProps) {
  const t = T(lang).dashboard.header;
  return (
    <div className="text-center">
      <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
        {t.unlocked}
      </span>
      <h1 className="text-2xl font-extrabold text-white">
        {t.ready}
      </h1>
      <p className="text-slate-400 text-sm mt-1 truncate">📍 {address}</p>
    </div>
  );
}
