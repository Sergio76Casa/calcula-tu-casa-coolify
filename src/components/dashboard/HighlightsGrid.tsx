"use client";

import type { PropertyDetails } from "@/components/landing/PropertyDetailsStep";

interface HighlightsGridProps {
  details: PropertyDetails;
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

function getHighlights(d: PropertyDetails): {
  pros: Highlight[];
  cons: Highlight[];
} {
  const pros: Highlight[] = [];
  const cons: Highlight[] = [];

  if (d.estado === "nuevo") {
    pros.push({
      icon: "✨",
      text: "Propiedad **completamente reformada** — máximo atractivo",
    });
  } else if (d.estado === "bueno") {
    pros.push({
      icon: "✅",
      text: "**Buen estado** de conservación — lista para entrar a vivir",
    });
  } else {
    cons.push({
      icon: "🔨",
      text: "Requiere **reforma integral** — reduce el precio de entrada",
    });
  }

  const hab = d.habitaciones >= 4 ? "4+" : String(d.habitaciones);
  if (d.habitaciones >= 3) {
    pros.push({
      icon: "🛏",
      text: `**${hab} habitaciones** — distribución muy demandada`,
    });
  } else {
    cons.push({
      icon: "📦",
      text: `**${hab} habitación** — mercado objetivo más reducido`,
    });
  }

  if (d.m2 >= 80) {
    pros.push({
      icon: "📐",
      text: `**${d.m2} m²** construidos — superficie especialmente valorada`,
    });
  } else if (d.m2 < 55) {
    cons.push({
      icon: "📐",
      text: `**${d.m2} m²** — superficie ajustada respecto a la media`,
    });
  }

  if (d.tipo === "piso") {
    if (d.ascensor) {
      pros.push({
        icon: "🛗",
        text: "**Con ascensor** — añade entre un 5 y 8% de valor",
      });
    } else {
      cons.push({
        icon: "⚠️",
        text: "**Sin ascensor** — puede penalizar hasta un 8% el precio",
      });
    }
  }
  if (d.tipo === "casa") {
    if (d.jardin) {
      pros.push({
        icon: "🌿",
        text: "**Jardín o parcela** — incrementa el valor un 10–25%",
      });
    } else {
      cons.push({
        icon: "🏡",
        text: "Sin jardín — **recorrido de mejora** en tipología casa",
      });
    }
  }
  return { pros, cons };
}

export default function HighlightsGrid({ details }: HighlightsGridProps) {
  const { pros, cons } = getHighlights(details);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-4">
          ✅ Puntos fuertes
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
            <li className="text-slate-500 text-sm">Sin puntos destacados.</li>
          )}
        </ul>
      </div>
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-4">
          ⚠️ Puntos a considerar
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
            <li className="text-slate-500 text-sm">Sin puntos a mejorar.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
