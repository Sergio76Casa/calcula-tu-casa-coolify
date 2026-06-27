import type { jsPDF } from "jspdf";
import type { Lang } from "@/lib/translations";
import type { ValuationResult, EntornoData, AnalisisBarrio, POI } from "@/lib/valorar/types";
import { U } from "@/lib/uiStrings";
import { C, PDF_DIMENSIONS } from "@/lib/pdf/pdfConfig";
import { stripEmoji, drawHeader, drawFooter } from "@/lib/pdf/pdfHelpers";

export function drawPage3Neighbourhood(
  doc: jsPDF,
  result: ValuationResult,
  entorno: EntornoData | null | undefined,
  analisisBarrio: AnalisisBarrio | null | undefined,
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

  drawHeader(doc, refId, dateStr, 3, 4);
  let y = 28;

  // Título sección
  doc.setFillColor(...C.bg);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 10, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "bold");
  doc.text(t.pag3_titulo, PDF_DIMENSIONS.ML + 4, y + 7);
  y += 14;

  // Grid 4x2 de categorías POI
  const catDefs: { key: keyof EntornoData; label: string; icon: string }[] = [
    { key: "colegios", label: t.cat_colegios, icon: "COL" },
    { key: "supermercados", label: t.cat_supermercados, icon: "SUP" },
    { key: "farmacias", label: t.cat_farmacias, icon: "FAR" },
    { key: "transporte", label: t.cat_transporte, icon: "TRA" },
    { key: "parques", label: t.cat_parques, icon: "PAR" },
    { key: "restaurantes", label: t.cat_restaurantes, icon: "RES" },
    { key: "gasolineras", label: t.cat_gasolineras, icon: "GAS" },
    { key: "salud", label: t.cat_salud, icon: "SAL" },
  ];

  const cellW = (PDF_DIMENSIONS.CW - 9) / 4;
  const cellH = 28;
  const cellGapX = 3;
  const cellGapY = 3;
  const cols = 4;

  catDefs.forEach(({ key, label, icon }, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx2 = PDF_DIMENSIONS.ML + col * (cellW + cellGapX);
    const cy2 = y + row * (cellH + cellGapY);

    doc.setFillColor(...C.bg);
    doc.roundedRect(cx2, cy2, cellW, cellH, 2, 2, "F");
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.2);
    doc.roundedRect(cx2, cy2, cellW, cellH, 2, 2, "S");

    // Icono
    doc.setFontSize(7);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(icon, cx2 + 2, cy2 + 6);

    // Categoría
    doc.setFontSize(6.5);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "bold");
    doc.text(label, cx2 + 2, cy2 + 11);

    const pois = (entorno?.[key] as POI[]) ?? [];
    if (pois && pois.length > 0) {
      const first = pois[0];
      const nameLines = doc.splitTextToSize(first.nombre, cellW - 4);
      doc.setFontSize(6.5);
      doc.setTextColor(...C.dark);
      doc.setFont("helvetica", "bold");
      doc.text(nameLines.slice(0, 2), cx2 + 2, cy2 + 17);
      doc.setFontSize(6);
      doc.setTextColor(...C.slate5);
      doc.setFont("helvetica", "normal");
      doc.text(`${first.distancia_m} m`, cx2 + 2, cy2 + 24);
    } else {
      doc.setFontSize(6.5);
      doc.setTextColor(...C.slate5);
      doc.setFont("helvetica", "italic");
      const noFound =
        lang === "en" ? "Not found" : lang === "ca" ? "No trobat" : "No encontrado";
      doc.text(noFound, cx2 + 2, cy2 + 17);
    }
  });

  y += 2 * (cellH + cellGapY) + 6;

  // Separador
  doc.setDrawColor(...C.slate3);
  doc.setLineWidth(0.3);
  doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
  y += 6;

  // Análisis de barrio
  if (analisisBarrio) {
    // Tipo de barrio
    doc.setFillColor(20, 40, 60);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 10, 2, 2, "F");
    doc.setDrawColor(...C.emerald);
    doc.setLineWidth(0.3);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 10, 2, 2, "S");
    doc.setFontSize(7);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "normal");
    doc.text(t.pag3_tipo_barrio.toUpperCase() + ":", PDF_DIMENSIONS.ML + 4, y + 6);
    doc.setFontSize(8);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(analisisBarrio.tipo_barrio, PDF_DIMENSIONS.ML + 4 + 38, y + 6);
    y += 13;

    // Puntuación servicios
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag3_puntuacion, PDF_DIMENSIONS.ML, y);
    const scoreVal = analisisBarrio.puntuacion_servicios ?? 0;
    doc.setFontSize(14);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(`${scoreVal}/10`, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y + 3, {
      align: "right",
    });
    y += 6;
    doc.setFillColor(...C.slate3);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 4, 1, 1, "F");
    doc.setFillColor(...C.emerald);
    doc.roundedRect(
      PDF_DIMENSIONS.ML,
      y,
      PDF_DIMENSIONS.CW * (scoreVal / 10),
      4,
      1,
      1,
      "F"
    );
    y += 8;

    // Descripción
    doc.setFontSize(8.5);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "normal");
    const descLines = doc.splitTextToSize(analisisBarrio.descripcion ?? "", PDF_DIMENSIONS.CW);
    doc.text(descLines.slice(0, 8), PDF_DIMENSIONS.ML, y);
    y += Math.min(descLines.length, 8) * 4.5 + 4;

    // Ventajas
    if ((analisisBarrio.ventajas_ubicacion?.length ?? 0) > 0) {
      doc.setFontSize(8);
      doc.setTextColor(...C.dark);
      doc.setFont("helvetica", "bold");
      doc.text(t.pag3_ventajas, PDF_DIMENSIONS.ML, y);
      y += 5;
      analisisBarrio.ventajas_ubicacion.slice(0, 4).forEach((v) => {
        doc.setFontSize(8);
        doc.setTextColor(...C.dark);
        doc.setFont("helvetica", "normal");
        const vLines = doc.splitTextToSize("+ " + v, PDF_DIMENSIONS.CW - 4);
        doc.text(vLines, PDF_DIMENSIONS.ML + 2, y);
        y += vLines.length * 4.5 + 1;
      });
    }
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "italic");
    const noData =
      lang === "en"
        ? "Neighbourhood analysis not available."
        : lang === "ca"
        ? "Analisi de barri no disponible."
        : "Analisis de barrio no disponible.";
    doc.text(noData, PDF_DIMENSIONS.ML, y);
    y += 8;
  }

  // Mapa de texto y verificación
  if (y < PDF_DIMENSIONS.PAGE_MAX - 25) {
    y += 4;
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
    y += 5;

    doc.setFillColor(245, 247, 250);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 14, 2, 2, "F");
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.2);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 14, 2, 2, "S");

    let latVal = 40.4167;
    let lonVal = -3.7037;
    if (result.coordenadas?.lat && result.coordenadas?.lon) {
      latVal = result.coordenadas.lat;
      lonVal = result.coordenadas.lon;
    }

    const hash = refId + "-" + Math.floor(1000 + Math.random() * 9000);

    doc.setFontSize(7.5);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    const verifTitle =
      lang === "en"
        ? "PROP VERIFICATION & GEOLOCATION"
        : lang === "ca"
        ? "VERIFICACIO I GEOLOCALITZACIO"
        : "VERIFICACIÓN Y GEOLOCALIZACIÓN";
    doc.text(verifTitle, PDF_DIMENSIONS.ML + 4, y + 5);

    doc.setFontSize(7);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "normal");
    const verifDesc =
      lang === "en"
        ? `Property verified at coordinates: ${latVal.toFixed(5)}° N, ${lonVal.toFixed(5)}° E · Verification Code: ${hash}`
        : lang === "ca"
        ? `Propietat verificada a les coordenades: ${latVal.toFixed(5)}° N, ${lonVal.toFixed(5)}° E · Codi de verificacio: ${hash}`
        : `Propiedad verified en coordenadas: ${latVal.toFixed(5)}° N, ${lonVal.toFixed(5)}° E · Código de verificación: ${hash}`;
    doc.text(verifDesc, PDF_DIMENSIONS.ML + 4, y + 9.5);
  }

  drawFooter(doc, t.footer);
}
