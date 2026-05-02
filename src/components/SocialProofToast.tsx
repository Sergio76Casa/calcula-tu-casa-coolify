"use client";

import { useState, useEffect, useCallback } from "react";
import { U } from "@/lib/uiStrings";
import type { Lang } from "@/lib/translations";

// ─── Barrios / vecindarios conocidos ─────────────────────────────────────────

const NEIGHBORHOODS = [
  "Gracia", "Malasaña", "Chamberí", "Eixample", "Gràcia",
  "El Born", "Lavapiés", "Chueca", "Triana", "Nervión",
  "El Cabanyal", "Gros", "Salamanca", "Ruzafa", "Bilbao la Vieja",
  "Poble Sec", "Sant Gervasi", "Moncloa", "Carabanchel", "Hortaleza",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function SocialProofToast({ lang }: { lang: Lang }) {
  const [visible,      setVisible]      = useState(false);
  const [neighborhood, setNeighborhood] = useState("");
  const t = U(lang).toast;

  const fire = useCallback(() => {
    setNeighborhood(pick(NEIGHBORHOODS));
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    // First pop after 4 s, then every ~25 s
    const first    = setTimeout(fire, 4000);
    const interval = setInterval(fire, 25000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [fire]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-[280px]">
        <span className="text-xl flex-shrink-0" aria-hidden="true">🏠</span>
        <p className="text-slate-300 text-sm leading-snug">
          <span className="text-white font-semibold">
            {t.prefix} {neighborhood}
          </span>{" "}
          {t.suffix}
        </p>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}
