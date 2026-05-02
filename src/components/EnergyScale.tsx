"use client";

import type { EnergyCertificate } from "@/components/landing/PropertyDetailsStep";

interface EnergyScaleProps {
  cert?: EnergyCertificate | null;
}

const SCALE = [
  { l: "A", bg: "#166534", w: 55 },
  { l: "B", bg: "#15803d", w: 62 },
  { l: "C", bg: "#4d7c0f", w: 69 },
  { l: "D", bg: "#a16207", w: 76 },
  { l: "E", bg: "#9a3412", w: 83 },
  { l: "F", bg: "#b91c1c", w: 90 },
  { l: "G", bg: "#7f1d1d", w: 100 },
] as const;

const CLIP  = "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)";
const NEON  = "drop-shadow(0 0 5px #34d399) drop-shadow(0 0 10px rgba(52,211,153,0.5))";

export default function EnergyScale({ cert }: EnergyScaleProps) {
  const active = cert && cert !== "pending" ? cert : null;

  return (
    <div className="space-y-1.5">
      {SCALE.map(({ l, bg, w }) => {
        const isActive = active === l;
        return (
          <div key={l} className="flex items-center gap-3" style={{ height: 28 }}>
            <div
              className="flex items-center px-3 h-full text-white font-black text-sm select-none"
              style={{
                width: `${w}%`,
                backgroundColor: bg,
                clipPath: CLIP,
                filter: isActive ? NEON : "none",
              }}
            >
              {l}
            </div>
            {isActive && (
              <span
                className="text-emerald-400 text-xs font-bold whitespace-nowrap"
                style={{ textShadow: "0 0 8px rgba(52,211,153,0.8)" }}
              >
                ← Tu propiedad
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
