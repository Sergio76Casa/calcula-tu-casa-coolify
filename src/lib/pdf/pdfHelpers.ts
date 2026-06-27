import type { jsPDF } from "jspdf";
import type { Lang } from "../translations";
import { C, PDF_DIMENSIONS, LOGO_BASE64 } from "./pdfConfig";

export function stripEmoji(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "").trim();
}

export function fmt(n: number): string {
  return n.toLocaleString("es-ES") + " EUR";
}

export function fmtShort(n: number): string {
  return n.toLocaleString("es-ES") + " EUR";
}

export function energyImpactMsg(cert: string, lang: Lang): string {
  if (lang === "en") {
    if ("AB".includes(cert))
      return "High energy efficiency — can increase sale value by 5-10%.";
    if ("CD".includes(cert))
      return "Medium efficiency — standard for properties of this age and area.";
    return "Low efficiency — may result in a discount of up to 5% on the sale price.";
  }
  if (lang === "ca") {
    if ("AB".includes(cert))
      return "Alta eficiencia energetica — pot incrementar el valor de venda un 5-10%.";
    if ("CD".includes(cert))
      return "Eficiencia mitja — estandard per a propietats de la zona i antiguitat.";
    return "Baixa eficiencia — pot suposar un descompte de fins a un 5% en el preu de venda.";
  }
  if ("AB".includes(cert))
    return "Alta eficiencia energetica — puede incrementar el valor de venta un 5-10%.";
  if ("CD".includes(cert))
    return "Eficiencia media — estandar para propiedades de la zona y antiguedad.";
  return "Baja eficiencia — puede suponer un descuento de hasta un 5% en el precio de venta.";
}

// Cuota hipotecaria mensual (formula francesa)
export function cuotaMensual(
  capital: number,
  tasaAnual: number,
  anios: number
): number {
  const r = tasaAnual / 12;
  const n = anios * 12;
  return (capital * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// Headers y Footers Recurrentes
export function drawHeader(
  doc: jsPDF,
  refId: string,
  dateStr: string,
  pageNum: number,
  pageTotal: number
) {
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, PDF_DIMENSIONS.W, 22, "F");
  const lw = 60;
  const lh = 18;
  doc.addImage(LOGO_BASE64, "JPEG", PDF_DIMENSIONS.ML, 2, lw, lh);
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Ref. ${refId}`,
    PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR,
    9,
    { align: "right" }
  );
  doc.text(
    dateStr,
    PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR,
    15,
    { align: "right" }
  );
  doc.setFontSize(7);
  doc.setTextColor(...C.slate3);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${pageNum} / ${pageTotal}`,
    PDF_DIMENSIONS.W / 2,
    19,
    { align: "center" }
  );
}

export function drawFooter(doc: jsPDF, footerText: string) {
  doc.setDrawColor(...C.slate3);
  doc.setLineWidth(0.2);
  doc.line(
    PDF_DIMENSIONS.ML,
    PDF_DIMENSIONS.PAGE_MAX + 2,
    PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR,
    PDF_DIMENSIONS.PAGE_MAX + 2
  );
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(
    footerText,
    PDF_DIMENSIONS.W / 2,
    PDF_DIMENSIONS.PAGE_MAX + 8,
    { align: "center" }
  );
}
