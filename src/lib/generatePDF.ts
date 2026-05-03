import type { ValuationResult } from "@/components/landing/LoadingValuationStep";
import type { PropertyDetails }  from "@/components/landing/PropertyDetailsStep";
import type { Lang }             from "./translations";
import { U }                     from "./uiStrings";
import { LOGO_BASE64 }           from "./logoBase64";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripEmoji(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "").trim();
}

function fmt(n: number): string {
  return n.toLocaleString("es-ES") + " €";
}

// ─── Paleta (RGB) ─────────────────────────────────────────────────────────────

const C = {
  dark:    [15,  23,  42]  as [number, number, number],
  emerald: [52,  211, 153] as [number, number, number],
  slate5:  [100, 116, 139] as [number, number, number],
  slate3:  [203, 213, 225] as [number, number, number],
  white:   [255, 255, 255] as [number, number, number],
  black:   [15,  23,  42]  as [number, number, number],
  bg:      [248, 250, 252] as [number, number, number],
};

// ─── Colores escala energética ────────────────────────────────────────────────

const ENERGY_RGB: Record<string, [number, number, number]> = {
  A: [22,101,52], B: [21,128,61], C: [77,124,15],
  D: [161,98,7],  E: [154,52,18], F: [185,28,28], G: [127,29,29],
};

function energyImpactMsg(cert: string): string {
  if ("AB".includes(cert)) return "Alta eficiencia energética — puede incrementar el valor de venta un 5–10%.";
  if ("CD".includes(cert)) return "Eficiencia media — estándar para propiedades de la zona y antigüedad.";
  return "Baja eficiencia — puede suponer un descuento de hasta un 5% en el precio de venta.";
}


// ─── Generador principal ──────────────────────────────────────────────────────

export async function generatePDF(
  result:   ValuationResult,
  details:  PropertyDetails,
  address:  string,
  lang:     Lang,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const t = U(lang).pdf;

  const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W    = 210;
  const ML   = 20;
  const MR   = 20;
  const CW   = W - ML - MR;
  let y      = 0;

  // ── Header ────────────────────────────────────────────────────────────────
  const headerH = 55;
  const logoW   = 120;
  const logoH   = 38;
  doc.setFillColor(11, 16, 29);
  doc.rect(0, 0, W, headerH, "F");
  doc.addImage(LOGO_BASE64, "JPEG", (W - logoW) / 2, 6, logoW, logoH);
  doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "normal");
  doc.text(new Date().toLocaleDateString(lang === "en" ? "en-GB" : "es-ES"), W - MR, 10, { align: "right" });
  doc.setFontSize(8); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "italic");
  doc.text(t.subtitle, W / 2, 50, { align: "center" });
  y = 65;

  // ── Título + dirección ────────────────────────────────────────────────────
  doc.setFontSize(18); doc.setTextColor(...C.dark); doc.setFont("helvetica", "bold");
  doc.text(t.title, ML, y); y += 8;
  doc.setFontSize(9); doc.setTextColor(...C.slate5); doc.setFont("helvetica", "normal");
  const addrLines = doc.splitTextToSize("📍 " + address, CW);
  doc.text(stripEmoji(addrLines.join(" ")), ML, y); y += 6;
  const estado = { a_reformar: lang === "en" ? "needs work" : "a reformar", bueno: lang === "en" ? "good cond." : "buen estado", nuevo: lang === "en" ? "renovated" : "reformado" };
  const detailStr = `${details.m2} m²  ·  ${details.tipo === "piso" ? (lang === "en" ? "apartment" : lang === "ca" ? "pis" : "piso") : (lang === "en" ? "house" : "casa")}  ·  ${estado[details.estado]}  ·  ${details.habitaciones}${details.habitaciones >= 4 ? "+" : ""} hab.`;
  doc.text(detailStr, ML, y); y += 8;

  // ── Divisor ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...C.slate3); doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y); y += 8;

  // ── Tarjeta de precio ─────────────────────────────────────────────────────
  doc.setFillColor(...C.bg);
  doc.roundedRect(ML, y, CW, 38, 4, 4, "F");
  doc.setDrawColor(...C.emerald); doc.setLineWidth(0.5);
  doc.roundedRect(ML, y, CW, 38, 4, 4, "S");
  doc.setFontSize(8); doc.setTextColor(...C.slate5); doc.setFont("helvetica", "normal");
  doc.text(t.estimated.toUpperCase(), ML + 8, y + 8);
  doc.setFontSize(30); doc.setTextColor(...C.emerald); doc.setFont("helvetica", "bold");
  doc.text(fmt(result.precio_sugerido), ML + 8, y + 24);
  doc.setFontSize(8); doc.setTextColor(...C.slate5); doc.setFont("helvetica", "normal");
  doc.text("Gemini 2.5 Flash · datos reales del mercado", ML + 8, y + 33);
  y += 46;

  // ── Barra de rango ────────────────────────────────────────────────────────
  const { minimo: min, maximo: max } = result.rango_precios;
  const mid = result.precio_sugerido;
  const pct = Math.max(0.05, Math.min(0.95, (mid - min) / (max - min)));
  const BAR_H = 5;
  doc.setFontSize(8); doc.setTextColor(...C.slate5); doc.setFont("helvetica", "normal");
  doc.text(t.range.toUpperCase(), ML, y); y += 5;
  doc.setFillColor(...C.slate3);
  doc.roundedRect(ML, y, CW, BAR_H, 2, 2, "F");
  doc.setFillColor(...C.emerald);
  doc.roundedRect(ML, y, CW * pct, BAR_H, 2, 2, "F");
  const dotX = ML + CW * pct;
  doc.setFillColor(...C.emerald); doc.circle(dotX, y + BAR_H / 2, 3.5, "F");
  doc.setFillColor(...C.white);   doc.circle(dotX, y + BAR_H / 2, 1.8, "F");
  y += BAR_H + 4;
  doc.setFontSize(8); doc.setTextColor(...C.slate5);
  doc.text(t.min, ML, y);          doc.text(fmt(min), ML, y + 4);
  doc.text(t.suggested, dotX, y, { align: "center" });
  doc.setTextColor(...C.emerald); doc.setFont("helvetica", "bold");
  doc.text(fmt(mid), dotX, y + 4, { align: "center" });
  doc.setTextColor(...C.slate5); doc.setFont("helvetica", "normal");
  doc.text(t.max, W - MR, y, { align: "right" }); doc.text(fmt(max), W - MR, y + 4, { align: "right" });
  y += 12;

  // ── Impacto Energético ────────────────────────────────────────────────────
  const cert = details.energyCertificate;
  if (cert && cert !== "pending") {
    doc.setDrawColor(...C.slate3); doc.setLineWidth(0.3);
    doc.line(ML, y, W - MR, y); y += 8;

    doc.setFontSize(8); doc.setTextColor(...C.slate5); doc.setFont("helvetica", "normal");
    doc.text(t.energyImpact.toUpperCase(), ML, y); y += 7;

    // Badge coloreado con la letra de calificación
    doc.setFillColor(...ENERGY_RGB[cert]);
    doc.roundedRect(ML, y, 12, 12, 2, 2, "F");
    doc.setFontSize(14); doc.setTextColor(...C.white); doc.setFont("helvetica", "bold");
    doc.text(cert, ML + 3.5, y + 9.5);

    // Texto de impacto al lado del badge
    doc.setFontSize(9); doc.setTextColor(...C.dark); doc.setFont("helvetica", "normal");
    const impLines = doc.splitTextToSize(energyImpactMsg(cert), CW - 16);
    doc.text(impLines, ML + 16, y + 7);
    y += Math.max(14, impLines.length * 5) + 8;
  }

  // ── Argumentario ─────────────────────────────────────────────────────────
  doc.setDrawColor(...C.slate3); doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y); y += 8;
  doc.setFontSize(8); doc.setTextColor(...C.slate5); doc.setFont("helvetica", "normal");
  doc.text(t.analysis.toUpperCase(), ML, y); y += 6;
  doc.setFontSize(10); doc.setTextColor(...C.black); doc.setFont("helvetica", "normal");
  const clean = stripEmoji(result.argumentario_venta);
  const paras = doc.splitTextToSize(clean, CW);
  doc.text(paras, ML, y); y += paras.length * 5 + 8;

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = 285;
  doc.setDrawColor(...C.slate3); doc.setLineWidth(0.3);
  doc.line(ML, footerY - 4, W - MR, footerY - 4);
  doc.setFontSize(8); doc.setTextColor(...C.slate5);
  doc.text(t.footer, W / 2, footerY, { align: "center" });

  doc.save(`${t.filename}.pdf`);
}
