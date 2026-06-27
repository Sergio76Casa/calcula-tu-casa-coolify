import type { jsPDF } from "jspdf";
import type { Lang } from "@/lib/translations";
import type { PropertyDetails } from "@/components/landing/PropertyDetailsStep";
import type { ValuationResult } from "@/lib/valorar/types";
import { U } from "@/lib/uiStrings";
import { C, PDF_DIMENSIONS, LOGO_BASE64 } from "@/lib/pdf/pdfConfig";
import { stripEmoji } from "@/lib/pdf/pdfHelpers";

export function drawPage0Cover(
  doc: jsPDF,
  result: ValuationResult,
  details: PropertyDetails,
  address: string,
  lang: Lang,
  userName?: string | null
) {
  const t = U(lang).pdf;
  const refId =
    (result.valoracion_id ?? "").slice(0, 8).toUpperCase() || "--------";
  const dateStr = new Date().toLocaleDateString(
    lang === "en" ? "en-GB" : "es-ES",
    { day: "2-digit", month: "long", year: "numeric" }
  );

  // Fondo oscuro completo
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, PDF_DIMENSIONS.W, PDF_DIMENSIONS.H, "F");

  // Logo centrado grande
  const logoW = 150;
  const logoH = 45;
  doc.addImage(
    LOGO_BASE64,
    "JPEG",
    (PDF_DIMENSIONS.W - logoW) / 2,
    22,
    logoW,
    logoH
  );

  // Línea separadora emerald
  let y = 74;
  doc.setDrawColor(...C.emerald);
  doc.setLineWidth(0.5);
  doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
  y += 8;

  // Título principal
  doc.setFontSize(16);
  doc.setTextColor(...C.white);
  doc.setFont("helvetica", "bold");
  doc.text(t.portada_titulo, PDF_DIMENSIONS.W / 2, y, { align: "center" });
  y += 8;

  // Línea separadora
  doc.setDrawColor(...C.emerald);
  doc.setLineWidth(0.5);
  doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
  y += 10;

  // Dirección en emerald
  doc.setFontSize(12);
  doc.setTextColor(...C.emerald);
  doc.setFont("helvetica", "bold");
  const cleanAddr = stripEmoji(address);
  const addrLines = doc.splitTextToSize(cleanAddr, PDF_DIMENSIONS.CW - 20);
  doc.text(addrLines, PDF_DIMENSIONS.W / 2, y, { align: "center" });
  y += addrLines.length * 6 + 10;

  // Preparado para
  if (userName) {
    doc.setFontSize(8);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "normal");
    doc.text(t.portada_exclusivo.toUpperCase(), PDF_DIMENSIONS.W / 2, y, {
      align: "center",
    });
    y += 6;
    doc.setFontSize(14);
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "bold");
    doc.text(userName.toUpperCase(), PDF_DIMENSIONS.W / 2, y, {
      align: "center",
    });
    y += 10;
  }

  // Ref e ID
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(`Ref. ${refId}`, PDF_DIMENSIONS.W / 2, y, { align: "center" });
  y += 5;
  doc.text(dateStr, PDF_DIMENSIONS.W / 2, y, { align: "center" });
  y += 14;

  // 3 badges de metodología
  const badges = t.portada_metodologia as readonly string[];
  const badgeW = 52;
  const badgeH = 10;
  const badgeGap = 4;
  const totalBadges = badgeW * 3 + badgeGap * 2;
  let bx = (PDF_DIMENSIONS.W - totalBadges) / 2;
  for (const label of badges) {
    doc.setFillColor(20, 40, 60);
    doc.roundedRect(bx, y, badgeW, badgeH, 2, 2, "F");
    doc.setDrawColor(...C.emerald);
    doc.setLineWidth(0.3);
    doc.roundedRect(bx, y, badgeW, badgeH, 2, 2, "S");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(label, bx + badgeW / 2, y + 6.5, { align: "center" });
    bx += badgeW + badgeGap;
  }

  // Cuadro de confidencialidad
  doc.setFillColor(25, 35, 55);
  doc.roundedRect(
    PDF_DIMENSIONS.ML,
    270,
    PDF_DIMENSIONS.CW,
    18,
    2,
    2,
    "F"
  );
  doc.setDrawColor(...C.slate5);
  doc.setLineWidth(0.2);
  doc.roundedRect(
    PDF_DIMENSIONS.ML,
    270,
    PDF_DIMENSIONS.CW,
    18,
    2,
    2,
    "S"
  );
  doc.setFontSize(7);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "italic");
  const confLines = doc.splitTextToSize(
    t.portada_confidencial,
    PDF_DIMENSIONS.CW - 8
  );
  doc.text(confLines, PDF_DIMENSIONS.W / 2, 279, { align: "center" });
}
