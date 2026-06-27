import type { jsPDF } from "jspdf";
import type { Lang } from "@/lib/translations";
import type { ValuationResult } from "@/lib/valorar/types";
import { U } from "@/lib/uiStrings";
import { C, PDF_DIMENSIONS } from "@/lib/pdf/pdfConfig";
import { fmtShort, cuotaMensual, drawHeader } from "@/lib/pdf/pdfHelpers";

type RGB = [number, number, number];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawEscenariosTable(doc: jsPDF, precio: number, alquiler: number, y: number, t: any, lang: Lang) {
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "bold");
  doc.text(t.pag4_escenarios, PDF_DIMENSIONS.ML, y);
  y += 5;

  const escenarios = [
    { nombre: lang === "en" ? "Conservative" : "Conservador", renta: alquiler * 0.9, ocup: 85 },
    { nombre: lang === "en" ? "Moderate" : "Moderado", renta: alquiler, ocup: 92 },
    { nombre: lang === "en" ? "Optimistic" : "Optimista", renta: alquiler * 1.1, ocup: 98 },
  ];

  const escHdrs = [
    lang === "en" ? "Scenario" : "Escenario",
    lang === "en" ? "Monthly rent" : lang === "ca" ? "Renda mensual" : "Renta mensual",
    lang === "en" ? "Occupancy" : lang === "ca" ? "Ocupacio" : "Ocupacion",
    lang === "en" ? "Gross yield" : lang === "ca" ? "Rendibilitat" : "Rentabilidad",
  ];
  const escColW = [40, 40, 30, 30];
  const rowHesc = 8;

  // Cabecera
  doc.setFillColor(...C.dark);
  doc.rect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, rowHesc, "F");
  doc.setFontSize(7);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  let exh = PDF_DIMENSIONS.ML + 2;
  escHdrs.forEach((h, i) => {
    doc.text(h, exh, y + 5.5);
    exh += escColW[i];
  });
  y += rowHesc;

  escenarios.forEach(({ nombre, renta, ocup }, ri) => {
    const bgRow: RGB = ri % 2 === 0 ? C.bg : C.white;
    doc.setFillColor(...bgRow);
    doc.rect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, rowHesc, "F");
    const rentaAnual = renta * 12 * (ocup / 100);
    const bruta = precio > 0 ? parseFloat(((rentaAnual / precio) * 100).toFixed(1)) : 0;
    const cells = [
      nombre,
      `${Math.round(renta).toLocaleString("es-ES")} EUR`,
      `${ocup}%`,
      `${bruta}%`,
    ];
    doc.setFontSize(7);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "normal");
    let ecx = PDF_DIMENSIONS.ML + 2;
    cells.forEach((cell, i) => {
      doc.text(cell, ecx, y + 5.5);
      ecx += escColW[i];
    });
    y += rowHesc;
  });
  return y + 5;
}

function drawCostesTable(doc: jsPDF, precio: number, y: number, t: any, lang: Lang) {
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "bold");
  doc.text(t.pag4_costes_comprador, PDF_DIMENSIONS.ML, y);
  y += 5;

  const costesComprador = [
    { label: lang === "en" ? "Transfer tax / VAT (10%)" : "ITP/IVA (10%)", pct: 0.1 },
    { label: lang === "en" ? "Notary (0.5%)" : "Notaria (0.5%)", pct: 0.005 },
    { label: lang === "en" ? "Registry (0.2%)" : "Registro (0.2%)", pct: 0.002 },
    { label: lang === "en" ? "Agency (0.3%)" : "Gestoria (0.3%)", pct: 0.003 },
  ];
  const totalPct = costesComprador.reduce((s, c) => s + c.pct, 0);
  const costRowH = 7;

  costesComprador.forEach(({ label, pct }) => {
    doc.setFontSize(7);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "normal");
    doc.text(label, PDF_DIMENSIONS.ML + 2, y + 5);
    doc.text(fmtShort(Math.round(precio * pct)), PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y + 5, { align: "right" });
    y += costRowH;
  });

  // Total costes
  doc.setFillColor(20, 50, 40);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, costRowH + 1, 1, 1, "F");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.emerald);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL ~${Math.round(totalPct * 100)}%`, PDF_DIMENSIONS.ML + 2, y + 5.5);
  doc.text(fmtShort(Math.round(precio * totalPct)), PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y + 5.5, { align: "right" });
  return y + costRowH + 4;
}

function drawHipotecaTable(doc: jsPDF, precio: number, y: number, t: any, lang: Lang) {
  doc.setFontSize(8);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "bold");
  doc.text(t.pag4_hipoteca, PDF_DIMENSIONS.ML, y);
  y += 4;

  const entrada = precio * 0.2;
  const capital = precio * 0.8;
  const tasa = 0.035;

  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(
    lang === "en"
      ? `Down payment 20%: ${fmtShort(Math.round(entrada))}   |   Capital to finance: ${fmtShort(Math.round(capital))}   |   Rate: 3.5%`
      : `Entrada 20%: ${fmtShort(Math.round(entrada))}   |   Capital: ${fmtShort(Math.round(capital))}   |   Tipo: 3.5%`,
    PDF_DIMENSIONS.ML,
    y + 5
  );
  y += 9;

  const plazoHdrs = [
    lang === "en" ? "Term" : "Plazo",
    lang === "en" ? "Monthly payment" : lang === "ca" ? "Quota mensual" : "Cuota mensual",
    lang === "en" ? "Total interest" : lang === "ca" ? "Total interessos" : "Total intereses",
  ];
  const plazoColW = [30, 60, 50];
  const plazoHt = 7;
  const plazos = [20, 25, 30];

  // Cabecera
  doc.setFillColor(...C.slate5);
  doc.rect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, plazoHt, "F");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  let phx = PDF_DIMENSIONS.ML + 2;
  plazoHdrs.forEach((h, i) => {
    doc.text(h, phx, y + 4.5);
    phx += plazoColW[i];
  });
  y += plazoHt;

  plazos.forEach((anios, ri) => {
    const bgRow: RGB = ri % 2 === 0 ? C.bg : C.white;
    doc.setFillColor(...bgRow);
    doc.rect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, plazoHt, "F");
    const cuota = cuotaMensual(capital, tasa, anios);
    const totalIntereses = cuota * anios * 12 - capital;
    const cells = [
      lang === "en" ? `${anios} years` : `${anios} anos`,
      `${Math.round(cuota).toLocaleString("es-ES")} EUR/mes`,
      `${Math.round(totalIntereses).toLocaleString("es-ES")} EUR`,
    ];
    doc.setFontSize(6.5);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "normal");
    let prcx = PDF_DIMENSIONS.ML + 2;
    cells.forEach((cell, i) => {
      doc.text(cell, prcx, y + 4.5);
      prcx += plazoColW[i];
    });
    y += plazoHt;
  });
  return y + 6;
}

// ─── Main Page Drawer ────────────────────────────────────────────────────────

export function drawPage4Financial(
  doc: jsPDF,
  result: ValuationResult,
  lang: Lang
) {
  const t = U(lang).pdf;
  const refId =
    (result.valoracion_id ?? "").slice(0, 8).toUpperCase() || "--------";
  const dateStr = new Date().toLocaleDateString(
    lang === "en" ? "en-GB" : "es-ES",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  drawHeader(doc, refId, dateStr, 4, 4);
  let y = 28;

  // Título sección
  doc.setFillColor(...C.bg);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 10, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "bold");
  doc.text(t.pag4_titulo, PDF_DIMENSIONS.ML + 4, y + 7);
  y += 14;

  const precio = result.precio_sugerido;

  // Box alquiler + rentabilidad
  const alqBox = 30;
  doc.setFillColor(...C.bg);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, alqBox, 3, 3, "F");
  doc.setDrawColor(...C.emerald);
  doc.setLineWidth(0.4);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, alqBox, 3, 3, "S");

  const alquiler = result.precio_alquiler_estimado ?? Math.round(precio * 0.004);
  const rentPct =
    result.rentabilidad_bruta_pct ??
    (precio > 0 ? parseFloat(((alquiler * 12) / precio * 100).toFixed(1)) : 0);
  const rentColor: RGB = rentPct > 5 ? C.green : rentPct >= 3 ? C.amber : C.red;

  const halfCW = PDF_DIMENSIONS.CW / 2;
  // Izquierda — alquiler
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.pag4_alquiler.toUpperCase(), PDF_DIMENSIONS.ML + 5, y + 8);
  doc.setFontSize(18);
  doc.setTextColor(...C.emerald);
  doc.setFont("helvetica", "bold");
  doc.text(`${alquiler.toLocaleString("es-ES")} EUR/mes`, PDF_DIMENSIONS.ML + 5, y + 22);

  // Derecha — rentabilidad
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.pag4_rentabilidad.toUpperCase(), PDF_DIMENSIONS.ML + halfCW + 5, y + 8);
  doc.setFontSize(18);
  doc.setTextColor(...rentColor);
  doc.setFont("helvetica", "bold");
  doc.text(`${rentPct}%`, PDF_DIMENSIONS.ML + halfCW + 5, y + 22);
  y += alqBox + 6;

  // Tabla escenarios
  if (y < PDF_DIMENSIONS.PAGE_MAX - 50) {
    y = drawEscenariosTable(doc, precio, alquiler, y, t, lang);
  }

  // Tiempo venta
  const diasVenta = result.tiempo_venta_estimado_dias;
  if (diasVenta && y < PDF_DIMENSIONS.PAGE_MAX - 20) {
    doc.setFillColor(219, 234, 254);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW / 2 - 3, 12, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "normal");
    doc.text(t.pag4_tiempo_venta.toUpperCase(), PDF_DIMENSIONS.ML + 3, y + 5);
    doc.setFontSize(9);
    doc.setTextColor(29, 78, 216);
    doc.setFont("helvetica", "bold");
    const daysLabel = lang === "en" ? `${diasVenta} days` : `${diasVenta} dias`;
    doc.text(daysLabel, PDF_DIMENSIONS.ML + 3, y + 10.5);
    y += 15;
  }

  // Recomendación precio salida
  if (result.recomendacion_precio_salida && y < PDF_DIMENSIONS.PAGE_MAX - 25) {
    doc.setFillColor(20, 40, 60);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 14, 2, 2, "F");
    doc.setDrawColor(...C.emerald);
    doc.setLineWidth(0.3);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 14, 2, 2, "S");
    doc.setFontSize(7);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag4_recomendacion.toUpperCase(), PDF_DIMENSIONS.ML + 4, y + 5);
    doc.setFontSize(7.5);
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "normal");
    const recLines = doc.splitTextToSize(result.recomendacion_precio_salida, PDF_DIMENSIONS.CW - 8);
    doc.text(recLines.slice(0, 2), PDF_DIMENSIONS.ML + 4, y + 10);
    y += 17;
  }

  // Separador
  if (y < PDF_DIMENSIONS.PAGE_MAX - 60) {
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
    y += 5;

    // Costes comprador
    y = drawCostesTable(doc, precio, y, t, lang);
  }

  // IBI estimado
  if (y < PDF_DIMENSIONS.PAGE_MAX - 20) {
    const ibi = Math.round(precio * 0.005);
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "normal");
    doc.text(`${t.pag4_ibi}: ~${ibi.toLocaleString("es-ES")} EUR`, PDF_DIMENSIONS.ML, y);
    y += 8;
  }

  // Hipoteca simplificada
  if (precio > 0 && y < PDF_DIMENSIONS.PAGE_MAX - 50) {
    y = drawHipotecaTable(doc, precio, y, t, lang);
  }

  // Score de inversión
  const scoreInv = result.score_inversion ?? 0;
  if (scoreInv > 0 && y < PDF_DIMENSIONS.PAGE_MAX - 22) {
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.score_inversion, PDF_DIMENSIONS.ML, y);
    y += 5;
    doc.setFillColor(...C.slate3);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 6, 1, 1, "F");
    const invColor = scoreInv >= 7 ? C.green : scoreInv >= 5 ? C.amber : C.red;
    doc.setFillColor(...invColor);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW * (scoreInv / 10), 6, 1, 1, "F");
    doc.setFontSize(8);
    doc.setTextColor(...invColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${scoreInv}/10`, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y + 5, { align: "right" });
    y += 10;
  }

  // Siguientes pasos
  if (y < PDF_DIMENSIONS.PAGE_MAX - 24) {
    doc.setFillColor(15, 35, 30);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 22, 3, 3, "F");
    doc.setDrawColor(...C.emerald);
    doc.setLineWidth(0.4);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 22, 3, 3, "S");

    doc.setFontSize(8.5);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag4_siguientes.toUpperCase(), PDF_DIMENSIONS.ML + 5, y + 7);
    doc.setFontSize(8);
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "normal");
    const nextTxt =
      lang === "en"
        ? "Do you want to confirm this valuation with a free on-site visit?"
        : lang === "ca"
        ? "Vols confirmar aquesta valoracio amb una visita presencial gratuita?"
        : "¿Quieres confirmar esta valoracion con una visita presencial gratuita?";
    const nextLines = doc.splitTextToSize(nextTxt, PDF_DIMENSIONS.CW - 10);
    doc.text(nextLines, PDF_DIMENSIONS.ML + 5, y + 13);
    doc.setFontSize(8);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text("calculatucasa.com  ·  wa.me/34602499146", PDF_DIMENSIONS.ML + 5, y + 19);
    y += 25;
  }

  // Footer final
  doc.setDrawColor(...C.slate3);
  doc.setLineWidth(0.2);
  doc.line(PDF_DIMENSIONS.ML, PDF_DIMENSIONS.PAGE_MAX + 2, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, PDF_DIMENSIONS.PAGE_MAX + 2);
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(`Generado por CalculaTuCasa.com · Ref. ${refId}`, PDF_DIMENSIONS.W / 2, PDF_DIMENSIONS.PAGE_MAX + 6, { align: "center" });
  const disclaimer =
    lang === "en"
      ? "This valuation is indicative and does not constitute an official appraisal. Subject to market conditions."
      : lang === "ca"
      ? "Aquesta valoracio es orientativa i no constitueix una taxacio oficial. Subjecta a les condicions del mercat."
      : "Esta valoracion es orientativa y no constituye tasacion oficial. Sujeta a condiciones del mercado.";
  const discLines = doc.splitTextToSize(disclaimer, PDF_DIMENSIONS.CW);
  doc.text(discLines, PDF_DIMENSIONS.W / 2, PDF_DIMENSIONS.PAGE_MAX + 10, { align: "center" });
}
