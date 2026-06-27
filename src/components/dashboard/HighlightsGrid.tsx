"use client";

import type { PropertyDetails } from "@/components/landing/PropertyDetailsStep";
import { T, type Lang } from "@/lib/translations";

interface HighlightsGridProps {
  details: PropertyDetails;
  lang?: Lang;
}

interface Highlight {
  icon: string;
  text: string;
}

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

function getHighlights(d: PropertyDetails, lang: Lang): {
  pros: Highlight[];
  cons: Highlight[];
} {
  const pros: Highlight[] = [];
  const cons: Highlight[] = [];
  const t = T(lang).dashboard.highlights;

  if (d.estado === "nuevo") {
    pros.push({
      icon: "✨",
      text: t.nuevo_pro,
    });
  } else if (d.estado === "bueno") {
    pros.push({
      icon: "✅",
      text: t.bueno_pro,
    });
  } else {
    cons.push({
      icon: "🔨",
      text: t.reformar_con,
    });
  }

  const hab = d.habitaciones >= 4 ? "4+" : String(d.habitaciones);
  if (d.habitaciones >= 3) {
    pros.push({
      icon: "🛏",
      text: t.habs_pro.replace("{hab}", hab),
    });
  } else {
    cons.push({
      icon: "📦",
      text: t.habs_con.replace("{hab}", hab),
    });
  }

  if (d.m2 >= 80) {
    pros.push({
      icon: "📐",
      text: t.m2_pro.replace("{m2}", String(d.m2)),
    });
  } else if (d.m2 < 55) {
    cons.push({
      icon: "📐",
      text: t.m2_con.replace("{m2}", String(d.m2)),
    });
  }

  if (d.tipo === "piso") {
    if (d.ascensor) {
      pros.push({
        icon: "🛗",
        text: t.lift_pro,
      });
    } else {
      cons.push({
        icon: "⚠️",
        text: t.lift_con,
      });
    }
  }
  if (d.tipo === "casa") {
    if (d.jardin) {
      pros.push({
        icon: "🌿",
        text: t.garden_pro,
      });
    } else {
      cons.push({
        icon: "🏡",
        text: t.garden_con,
      });
    }
  }
  return { pros, cons };
}

export default function HighlightsGrid({ details, lang = "es" }: HighlightsGridProps) {
  const { pros, cons } = getHighlights(details, lang);
  const t = T(lang).dashboard.highlights;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
          {t.titlePros}
        </p>
        <ul className="space-y-3">
          {pros.length > 0 ? (
            pros.map((p, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-slate-300 leading-snug"
              >
                <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  {p.icon}
                </span>
                <span>
                  <Bold text={p.text} />
                </span>
              </li>
            ))
          ) : (
            <li className="text-slate-500 text-sm">{t.noPros}</li>
          )}
        </ul>
      </div>
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">
          {t.titleCons}
        </p>
        <ul className="space-y-3">
          {cons.length > 0 ? (
            cons.map((c, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-slate-300 leading-snug"
              >
                <span className="flex-shrink-0 mt-0.5" aria-hidden="true">
                  {c.icon}
                </span>
                <span>
                  <Bold text={c.text} />
                </span>
              </li>
            ))
          ) : (
            <li className="text-slate-500 text-sm">{t.noCons}</li>
          )}
        </ul>
      </div>
    </div>
  );
}
