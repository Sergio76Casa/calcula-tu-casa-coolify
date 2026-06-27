import type { jsPDF } from "jspdf";
import type { Lang } from "@/lib/translations";
import type { PropertyDetails } from "@/components/landing/PropertyDetailsStep";
import type { ValuationResult } from "@/lib/valorar/types";
import { U } from "@/lib/uiStrings";
import { C, ENERGY_RGB, PDF_DIMENSIONS } from "@/lib/pdf/pdfConfig";
import { stripEmoji, fmt, fmtShort, energyImpactMsg, drawHeader, drawFooter } from "@/lib/pdf/pdfHelpers";

type RGB = [number, number, number];

// ─── Helper Highlights Fallback ──────────────────────────────────────────────

function getFallbackHighlights(details: PropertyDetails, lang: Lang) {
  const fuertes: string[] = [];
  const mejorar: string[] = [];
  if (details.ascensor)
    fuertes.push(
      lang === "en" ? "Has lift" : lang === "ca" ? "Amb ascensor" : "Con ascensor"
    );
  if (details.jardin)
    fuertes.push(
      lang === "en" ? "Garden" : lang === "ca" ? "Jardí" : "Jardin"
    );
  if (details.m2 > 80)
    fuertes.push(
      lang === "en" ? "Spacious" : lang === "ca" ? "Ampli" : "Amplio"
    );
  const certTop =
    details.energyCertificate && "AB".includes(details.energyCertificate);
  if (certTop)
    fuertes.push(
      lang === "en" ? "Energy cert. A/B" : "Cert. energetica A/B"
    );
  if (!details.ascensor && details.habitaciones > 2)
    mejorar.push(
      lang === "en"
        ? "No lift"
        : lang === "ca"
        ? "Sense ascensor"
        : "Sin ascensor"
    );
  if (details.estado === "a_reformar")
    mejorar.push(
      lang === "en"
        ? "Needs renovation"
        : lang === "ca"
        ? "Requereix reforma"
        : "Requiere reforma"
    );
  return { fuertes, mejorar };
}

// ─── Helper Energy Scale Drawer ──────────────────────────────────────────────

function drawEnergyScale(doc: jsPDF, details: PropertyDetails, lang: Lang, y: number, t: any) {
  if (y >= PDF_DIMENSIONS.PAGE_MAX - 50) return y;

  doc.setDrawColor(...C.slate3);
  doc.setLineWidth(0.3);
  doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.energyImpact.toUpperCase(), PDF_DIMENSIONS.ML, y);
  y += 5;

  const cert = details.energyCertificate || "pending";
  const letters = ["A", "B", "C", "D", "E", "F", "G"];
  const bH = 4.5;
  const bGap = 1.2;
  const bW0 = 38;
  letters.forEach((l, idx) => {
    const ly = y + idx * (bH + bGap);
    const len = bW0 + idx * 5;
    doc.setFillColor(...ENERGY_RGB[l]);
    doc.rect(PDF_DIMENSIONS.ML, ly, len, bH, "F");
    doc.setFontSize(7);
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "bold");
    doc.text(l, PDF_DIMENSIONS.ML + 2, ly + 3.5);
    if (l === cert) {
      doc.setDrawColor(...C.dark);
      doc.setLineWidth(0.5);
      doc.line(
        PDF_DIMENSIONS.ML + len + 2,
        ly + bH / 2,
        PDF_DIMENSIONS.ML + len + 8,
        ly + bH / 2
      );
      doc.setFontSize(7.5);
      doc.setTextColor(...C.dark);
      doc.setFont("helvetica", "bold");
      doc.text(
        lang === "en"
          ? "YOUR PROPERTY"
          : lang === "ca"
          ? "LA TEVA PROPIETAT"
          : "SU VIVIENDA",
        PDF_DIMENSIONS.ML + len + 10,
        ly + 3.5
      );
    }
  });

  if (cert === "pending") {
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(PDF_DIMENSIONS.ML + 85, y + 10, 60, 14, 2, 2, "F");
    doc.setDrawColor(191, 219, 254);
    doc.setLineWidth(0.3);
    doc.roundedRect(PDF_DIMENSIONS.ML + 85, y + 10, 60, 14, 2, 2, "S");
    doc.setFontSize(7.5);
    doc.setTextColor(29, 78, 216);
    doc.setFont("helvetica", "bold");
    doc.text(
      lang === "en"
        ? "CERT. PENDING"
        : lang === "ca"
        ? "CERTIFICAT EN TRAMIT"
        : "CERTIFICADO EN TRAMITE",
      PDF_DIMENSIONS.ML + 115,
      y + 17,
      { align: "center" }
    );
  }

  y += letters.length * (bH + bGap) + 5;
  doc.setFontSize(7.5);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "normal");
  const impMsg =
    cert === "pending"
      ? lang === "en"
        ? "Energy certificate pending. The final rating may affect market value by +/- 10%."
        : lang === "ca"
        ? "Certificat energetic en tramit. La qualificacio final pot afectar el valor un +/- 10%."
        : "Certificado energetico en tramite. La calificación final puede afectar al valor un +/- 10%."
      : energyImpactMsg(cert, lang);
  const impLines = doc.splitTextToSize(impMsg, PDF_DIMENSIONS.CW);
  doc.text(impLines, PDF_DIMENSIONS.ML, y);
  y += impLines.length * 4.5 + 4;
  return y;
}

// ─── Main Page Drawer ────────────────────────────────────────────────────────

export function drawPage1Valuation(
  doc: jsPDF,
  result: ValuationResult,
  details: PropertyDetails,
  lang: Lang,
  address: string
) {
  const t = U(lang).pdf;
  const refId =
    (result.valoracion_id ?? "").slice(0, 8).toUpperCase() || "--------";
  const dateStr = new Date().toLocaleDateString(
    lang === "en" ? "en-GB" : "es-ES",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  drawHeader(doc, refId, dateStr, 1, 4);
  let y = 28;

  // Título + dirección
  doc.setFontSize(14);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "bold");
  doc.text(t.title, PDF_DIMENSIONS.ML, y);
  y += 6;
  doc.setFontSize(8);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  const cleanAddr = stripEmoji(address);
  const addrShort = doc.splitTextToSize(cleanAddr, PDF_DIMENSIONS.CW);
  doc.text(addrShort, PDF_DIMENSIONS.ML, y);
  y += addrShort.length * 4 + 4;

  // Tabla resumen propiedad
  const estadoMap: Record<string, string> = {
    a_reformar: lang === "en" ? "Needs work" : "A reformar",
    bueno:      lang === "en" ? "Good cond." : lang === "ca" ? "Bon estat" : "Buen estado",
    nuevo:      lang === "en" ? "Renovated" : lang === "ca" ? "Reformat" : "Reformado",
  };
  const tipoMap: Record<string, string> = {
    piso: lang === "en" ? "Apartment" : lang === "ca" ? "Pis" : "Piso",
    casa: lang === "en" ? "House" : "Casa",
  };
  const propRows = [
    [
      lang === "en" ? "Type" : lang === "ca" ? "Tipus" : "Tipo",
      tipoMap[details.tipo] ?? details.tipo,
      lang === "en" ? "Area" : "Superficie",
      `${details.m2} m2`,
    ],
    [
      lang === "en" ? "Rooms" : lang === "ca" ? "Habitacions" : "Habitaciones",
      `${details.habitaciones}`,
      lang === "en" ? "Condition" : lang === "ca" ? "Estat" : "Estado",
      estadoMap[details.estado] ?? details.estado,
    ],
    [
      lang === "en" ? "Lift" : lang === "ca" ? "Ascensor" : "Ascensor",
      details.ascensor ? (lang === "en" ? "Yes" : "Si") : "No",
      lang === "en" ? "Energy" : "Energia",
      details.energyCertificate === "pending"
        ? lang === "en" ? "Pending" : "En tramite"
        : details.energyCertificate ?? "N/A",
    ],
  ];

  const colW1 = 28;
  const colW2 = 52;
  const colW3 = 28;
  const colW4 = 52;
  const rowH = 9;
  for (let ri = 0; ri < propRows.length; ri++) {
    const rowY = y + ri * rowH;
    const bg = ri % 2 === 0 ? C.bg : C.white;
    doc.setFillColor(...bg);
    doc.roundedRect(PDF_DIMENSIONS.ML, rowY, PDF_DIMENSIONS.CW, rowH, 1, 1, "F");
    const row = propRows[ri];
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.slate5);
    doc.text(row[0], PDF_DIMENSIONS.ML + 2, rowY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark);
    doc.text(row[1], PDF_DIMENSIONS.ML + 2 + colW1, rowY + 6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.slate5);
    doc.text(row[2], PDF_DIMENSIONS.ML + 2 + colW1 + colW2, rowY + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark);
    doc.text(row[3], PDF_DIMENSIONS.ML + 2 + colW1 + colW2 + colW3, rowY + 6);
  }
  y += propRows.length * rowH + 6;

  // Separador
  doc.setDrawColor(...C.slate3);
  doc.setLineWidth(0.3);
  doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
  y += 6;

  // Tarjeta precio principal
  const cardH = 36;
  doc.setFillColor(...C.bg);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, cardH, 4, 4, "F");
  doc.setDrawColor(...C.emerald);
  doc.setLineWidth(0.5);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, cardH, 4, 4, "S");

  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.estimated.toUpperCase(), PDF_DIMENSIONS.ML + 6, y + 8);

  doc.setFontSize(26);
  doc.setTextColor(...C.emerald);
  doc.setFont("helvetica", "bold");
  doc.text(fmt(result.precio_sugerido), PDF_DIMENSIONS.ML + 6, y + 24);

  // Badge €/m²
  const precioM2 =
    result.precio_por_m2_zona ??
    (details.m2 > 0 ? Math.round(result.precio_sugerido / details.m2) : 0);
  const m2badge = `~${precioM2.toLocaleString("es-ES")} EUR/m2`;
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(m2badge, PDF_DIMENSIONS.ML + 6, y + 32);

  // Badge score inversión
  const score = result.score_inversion ?? 0;
  const scoreColor: RGB = score >= 7 ? C.green : score >= 5 ? C.amber : C.red;
  if (score > 0) {
    const scoreTxt = `Score: ${score}/10`;
    const scoreBW = 28;
    const scoreBH = 8;
    const scoreBX = PDF_DIMENSIONS.ML + PDF_DIMENSIONS.CW - scoreBW - 6;
    doc.setFillColor(...scoreColor);
    doc.roundedRect(scoreBX, y + 8, scoreBW, scoreBH, 2, 2, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "bold");
    doc.text(scoreTxt, scoreBX + scoreBW / 2, y + 13.5, { align: "center" });
  }
  y += cardH + 6;

  // Barra de rango
  const { minimo: rMin, maximo: rMax } = result.rango_precios;
  const mid = result.precio_sugerido;
  const pct = Math.max(0.05, Math.min(0.95, (mid - rMin) / (rMax - rMin)));
  const BAR_H = 5;
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.range.toUpperCase(), PDF_DIMENSIONS.ML, y);
  y += 4;
  doc.setFillColor(...C.slate3);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, BAR_H, 2, 2, "F");
  doc.setFillColor(...C.emerald);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW * pct, BAR_H, 2, 2, "F");
  const dotX = PDF_DIMENSIONS.ML + PDF_DIMENSIONS.CW * pct;
  doc.setFillColor(...C.emerald);
  doc.circle(dotX, y + BAR_H / 2, 3, "F");
  doc.setFillColor(...C.white);
  doc.circle(dotX, y + BAR_H / 2, 1.5, "F");
  y += BAR_H + 4;
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.min, PDF_DIMENSIONS.ML, y);
  doc.text(fmtShort(rMin), PDF_DIMENSIONS.ML, y + 4);
  doc.text(t.suggested, dotX, y, { align: "center" });
  doc.setTextColor(...C.emerald);
  doc.setFont("helvetica", "bold");
  doc.text(fmtShort(mid), dotX, y + 4, { align: "center" });
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.max, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y, { align: "right" });
  doc.text(fmtShort(rMax), PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y + 4, { align: "right" });
  y += 12;

  // Posición en mercado
  const mktPct = Math.round(pct * 100);
  const mktMsg =
    lang === "en"
      ? `Your property is in the top ${100 - mktPct}% of the market in your area.`
      : lang === "ca"
      ? `La teva propietat es troba al ${100 - mktPct}% superior del mercat de la teva zona.`
      : `Tu propiedad se situa en el ${100 - mktPct}% superior del mercado de tu zona.`;
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "italic");
  const mktLines = doc.splitTextToSize(mktMsg, PDF_DIMENSIONS.CW);
  doc.text(mktLines, PDF_DIMENSIONS.ML, y);
  y += mktLines.length * 4.5 + 4;

  // Separador
  doc.setDrawColor(...C.slate3);
  doc.setLineWidth(0.3);
  doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
  y += 6;

  // Puntos fuertes / a mejorar
  const { fuertes: fb, mejorar: mb } = getFallbackHighlights(details, lang);
  const pfuertes = result.puntos_fuertes ?? fb;
  const pmejorar = result.puntos_a_mejorar ?? mb;

  const colHalf = (PDF_DIMENSIONS.CW - 5) / 2;
  const pfy = y;

  // Columna izquierda — puntos fuertes
  doc.setFontSize(8);
  doc.setTextColor(...C.green);
  doc.setFont("helvetica", "bold");
  doc.text("+ " + t.puntos_fuertes, PDF_DIMENSIONS.ML, y);
  y += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "normal");
  pfuertes.slice(0, 5).forEach((p) => {
    const lines = doc.splitTextToSize("• " + p, colHalf - 2);
    doc.text(lines, PDF_DIMENSIONS.ML, y);
    y += lines.length * 4.5;
  });

  // Columna derecha — puntos a mejorar
  let yrr = pfy;
  const rxStart = PDF_DIMENSIONS.ML + colHalf + 5;
  doc.setFontSize(8);
  doc.setTextColor(...C.amber);
  doc.setFont("helvetica", "bold");
  doc.text("△ " + t.puntos_mejorar, rxStart, yrr);
  yrr += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "normal");
  pmejorar.slice(0, 5).forEach((p) => {
    const lines = doc.splitTextToSize("• " + p, colHalf - 2);
    doc.text(lines, rxStart, yrr);
    yrr += lines.length * 4.5;
  });

  y = Math.max(y, yrr) + 4;

  // Escala energética
  y = drawEnergyScale(doc, details, lang, y, t);

  drawFooter(doc, t.footer);
}
