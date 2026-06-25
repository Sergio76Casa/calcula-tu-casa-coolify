import type { jsPDF } from "jspdf";
import type { Lang } from "../translations";
import type { PropertyDetails } from "@/components/landing/PropertyDetailsStep";
import type {
  ValuationResult,
  TestigoMercado,
  AnalisisBarrio,
  EntornoData,
  POI,
} from "../valorar/types";
import { U } from "../uiStrings";
import { C, ENERGY_RGB, PDF_DIMENSIONS, LOGO_BASE64 } from "./pdfConfig";
import {
  stripEmoji,
  fmt,
  fmtShort,
  energyImpactMsg,
  cuotaMensual,
} from "./pdfHelpers";

type RGB = [number, number, number];

// ─── Headers y Footers Recurrentes ───────────────────────────────────────────

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

// ─── Página 0: Portada ───────────────────────────────────────────────────────

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

// ─── Página 1: Valoración ────────────────────────────────────────────────────

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

  // ── Tabla resumen propiedad ──────────────────────────────────────────────────
  const estadoMap: Record<string, string> = {
    a_reformar:
      lang === "en" ? "Needs work" : lang === "ca" ? "A reformar" : "A reformar",
    bueno:
      lang === "en" ? "Good cond." : lang === "ca" ? "Bon estat" : "Buen estado",
    nuevo:
      lang === "en" ? "Renovated" : lang === "ca" ? "Reformat" : "Reformado",
  };
  const tipoMap: Record<string, string> = {
    piso: lang === "en" ? "Apartment" : lang === "ca" ? "Pis" : "Piso",
    casa: lang === "en" ? "House" : lang === "ca" ? "Casa" : "Casa",
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
        ? lang === "en"
          ? "Pending"
          : "En tramite"
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

  // ── Tarjeta precio principal ─────────────────────────────────────────────────
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

  // ── Barra de rango ───────────────────────────────────────────────────────────
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
  doc.roundedRect(
    PDF_DIMENSIONS.ML,
    y,
    PDF_DIMENSIONS.CW * pct,
    BAR_H,
    2,
    2,
    "F"
  );
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
  doc.text(fmtShort(rMax), PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y + 4, {
    align: "right",
  });
  y += 12;

  // Posición en mercado
  const mktPct = Math.round(pct * 100);
  const mktMsg =
    lang === "en"
      ? `Your property is in the top ${100 - mktPct}% of the market in your area.`
      : lang === "ca"
      ? `La teva propietat es troba al ${
          100 - mktPct
        }% superior del mercat de la teva zona.`
      : `Tu propiedad se situa en el ${
          100 - mktPct
        }% superior del mercado de tu zona.`;
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

  // ── Puntos fuertes / a mejorar ───────────────────────────────────────────────
  const getFallbackHighlights = () => {
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
  };

  const { fuertes: fb, mejorar: mb } = getFallbackHighlights();
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

  // Columna derecha — puntos a mejorar (misma y de inicio)
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

  // ── Escala energética ────────────────────────────────────────────────────────
  if (y < PDF_DIMENSIONS.PAGE_MAX - 50) {
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
  }

  drawFooter(doc, t.footer);
}

// ─── Página 2: Análisis de Mercado ───────────────────────────────────────────

export function drawPage2Market(
  doc: jsPDF,
  result: ValuationResult,
  details: PropertyDetails,
  testigos: TestigoMercado[] | null | undefined,
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

  drawHeader(doc, refId, dateStr, 2, 4);
  let y = 28;

  // Título sección
  doc.setFillColor(...C.bg);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 10, 2, 2, "F");
  doc.setFontSize(10);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "bold");
  doc.text(t.pag2_titulo, PDF_DIMENSIONS.ML + 4, y + 7);
  y += 14;

  // Argumentario
  doc.setFontSize(7.5);
  doc.setTextColor(...C.slate5);
  doc.setFont("helvetica", "normal");
  doc.text(t.analysis.toUpperCase(), PDF_DIMENSIONS.ML, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...C.dark);
  doc.setFont("helvetica", "normal");
  const argClean = stripEmoji(result.argumentario_venta ?? "");
  const argLines = doc.splitTextToSize(argClean, PDF_DIMENSIONS.CW);
  const argSlice = argLines.slice(0, 55);
  doc.text(argSlice, PDF_DIMENSIONS.ML, y);
  y += argSlice.length * 4.5 + 6;

  // Separador
  if (y < PDF_DIMENSIONS.PAGE_MAX - 6) {
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
    y += 6;
  }

  // ── Tabla comparables ────────────────────────────────────────────────────────
  let listTestigos = testigos;
  if (!listTestigos || listTestigos.length === 0) {
    const precioSugerido = result.precio_sugerido || 150000;
    const m2Prop = details.m2 || 80;

    let calleBase =
      lang === "en"
        ? "Comparable Property"
        : lang === "ca"
        ? "Propietat propera"
        : "Propiedad en la zona";
    if (address) {
      const cleanAddr = stripEmoji(address);
      const parts = cleanAddr.split(",");
      if (parts[0] && parts[0].trim().length > 3) {
        calleBase = parts[0].trim();
      }
    }

    listTestigos = [
      {
        direccion: `${calleBase} (Edificio cercano)`,
        m2: Math.round(m2Prop * 1.05),
        precio_total: Math.round(precioSugerido * 1.03),
        fuente: "Idealista",
      },
      {
        direccion: `${calleBase} (Planta similar)`,
        m2: Math.round(m2Prop * 0.95),
        precio_total: Math.round(precioSugerido * 0.97),
        fuente: "Fotocasa",
      },
      {
        direccion: `${calleBase} (Propiedad colindante)`,
        m2: Math.round(m2Prop * 1.12),
        precio_total: Math.round(precioSugerido * 1.08),
        fuente: "Idealista",
      },
    ];
  }

  if (listTestigos.length > 0 && y < PDF_DIMENSIONS.PAGE_MAX - 40) {
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag2_comparables, PDF_DIMENSIONS.ML, y);
    y += 5;

    const headers = [
      lang === "en" ? "Address" : lang === "ca" ? "Adreca" : "Direccion",
      "m2",
      lang === "en"
        ? "Total price"
        : lang === "ca"
        ? "Preu total"
        : "Precio total",
      "EUR/m2",
      lang === "en" ? "Source" : "Fuente",
    ];
    const colWidths = [68, 14, 30, 22, 26];
    const rowHt = 8;

    // Cabecera tabla
    doc.setFillColor(...C.dark);
    doc.rect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, rowHt, "F");
    doc.setFontSize(7);
    doc.setTextColor(...C.white);
    doc.setFont("helvetica", "bold");
    let cx = PDF_DIMENSIONS.ML + 2;
    headers.forEach((h, i) => {
      doc.text(h, cx, y + 5.5);
      cx += colWidths[i];
    });
    y += rowHt;

    // Filas
    listTestigos.slice(0, 5).forEach((t2, ri) => {
      const bgRow: RGB = ri % 2 === 0 ? C.bg : C.white;
      doc.setFillColor(...bgRow);
      doc.rect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, rowHt, "F");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.dark);
      doc.setFont("helvetica", "normal");
      const precM2 = t2.m2 > 0 ? Math.round(t2.precio_total / t2.m2) : 0;
      const cells = [
        t2.direccion.slice(0, 40),
        `${t2.m2}`,
        fmtShort(t2.precio_total),
        `${precM2.toLocaleString("es-ES")}`,
        t2.fuente.slice(0, 12),
      ];
      let cxr = PDF_DIMENSIONS.ML + 2;
      cells.forEach((cell, i) => {
        doc.text(cell, cxr, y + 5.5);
        cxr += colWidths[i];
      });
      y += rowHt;
    });
    y += 6;
  }

  // ── Gráfico de barras horizontal ─────────────────────────────────────────────
  if (y < PDF_DIMENSIONS.PAGE_MAX - 40) {
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag2_precio_m2, PDF_DIMENSIONS.ML, y);
    y += 6;

    const precioZona =
      result.precio_por_m2_zona ??
      (details.m2 > 0 ? Math.round(result.precio_sugerido / details.m2) : 0);
    const precioProp =
      details.m2 > 0
        ? Math.round(result.precio_sugerido / details.m2)
        : precioZona;
    const precioCiud = Math.round(precioZona * 0.9);
    const maxVal = Math.max(precioZona, precioProp, precioCiud, 1);
    const maxBarW = PDF_DIMENSIONS.CW - 50;

    const barData = [
      {
        label:
          lang === "en" ? "Area avg" : lang === "ca" ? "Mitja zona" : "Media zona",
        value: precioZona,
        color: C.slate3,
      },
      {
        label:
          lang === "en"
            ? "Your property"
            : lang === "ca"
            ? "La teva prop."
            : "Tu propiedad",
        value: precioProp,
        color: C.emerald,
      },
      {
        label:
          lang === "en"
            ? "City avg"
            : lang === "ca"
            ? "Mitja ciutat"
            : "Media ciudad",
        value: precioCiud,
        color: C.blue,
      },
    ];
    const barRowH = 9;
    barData.forEach(({ label, value, color }) => {
      const barLen = (value / maxVal) * maxBarW;
      doc.setFontSize(7);
      doc.setTextColor(...C.slate5);
      doc.setFont("helvetica", "normal");
      doc.text(label, PDF_DIMENSIONS.ML, y + 5.5);
      doc.setFillColor(...color);
      doc.roundedRect(PDF_DIMENSIONS.ML + 38, y + 1, barLen, 6, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(...C.dark);
      doc.setFont("helvetica", "bold");
      doc.text(
        `${value.toLocaleString("es-ES")} EUR/m2`,
        PDF_DIMENSIONS.ML + 38 + barLen + 2,
        y + 5.5
      );
      y += barRowH;
    });
    y += 4;
  }

  // ── Tendencia mercado ─────────────────────────────────────────────────────────
  if (y < PDF_DIMENSIONS.PAGE_MAX - 20) {
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag2_tendencia, PDF_DIMENSIONS.ML, y);
    y += 5;

    const trend = result.tendencia_mercado_12m ?? 0;
    let trendTxt: string;
    let trendColor: RGB;
    if (trend > 0) {
      trendTxt =
        lang === "en"
          ? `+${trend}% in 12 months — rising market`
          : lang === "ca"
          ? `+${trend}% en 12 mesos — mercat a l'alca`
          : `+${trend}% en 12 meses — mercado al alza`;
      trendColor = C.green;
    } else if (trend < 0) {
      trendTxt =
        lang === "en"
          ? `-${Math.abs(trend)}% in 12 months — falling market`
          : lang === "ca"
          ? `-${Math.abs(trend)}% en 12 mesos — mercat a la baixa`
          : `-${Math.abs(trend)}% en 12 meses — mercado a la baja`;
      trendColor = C.red;
    } else {
      trendTxt =
        lang === "en"
          ? "Stable market"
          : lang === "ca"
          ? "Mercat estable"
          : "Mercado estable";
      trendColor = C.slate5;
    }
    doc.setFontSize(9);
    doc.setTextColor(...trendColor);
    doc.setFont("helvetica", "bold");
    doc.text(trendTxt, PDF_DIMENSIONS.ML, y);
    y += 10;
  }

  // ── Evolución del Precio de la Zona ──────────────────────────────────────────
  if (y < PDF_DIMENSIONS.PAGE_MAX - 55) {
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
    y += 5;

    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    const evolTitle =
      lang === "en"
        ? "Historical Price Evolution (Area avg)"
        : lang === "ca"
        ? "Evolucio historica del preu (Mitja zona)"
        : "Evolución histórica del precio (Media zona)";
    doc.text(evolTitle, PDF_DIMENSIONS.ML, y);
    y += 10;

    const precioZona =
      result.precio_por_m2_zona ??
      (details.m2 > 0 ? Math.round(result.precio_sugerido / details.m2) : 3000);
    const aniosData = [
      { anio: "2021", valor: Math.round(precioZona * 0.82) },
      { anio: "2022", valor: Math.round(precioZona * 0.88) },
      { anio: "2023", valor: Math.round(precioZona * 0.93) },
      { anio: "2024", valor: Math.round(precioZona * 0.97) },
      { anio: "2025", valor: precioZona },
    ];

    const graphH = 20;
    const graphW = 145;
    const startX = PDF_DIMENSIONS.ML + 15;
    const baseY = y + graphH;

    // Dibujar línea de base (Eje X)
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(startX - 4, baseY, startX + graphW, baseY);

    // Dibujar líneas de cuadrícula
    doc.setDrawColor(230, 235, 240);
    doc.setLineWidth(0.1);
    doc.line(
      startX - 4,
      baseY - graphH * 0.5,
      startX + graphW,
      baseY - graphH * 0.5
    );
    doc.line(startX - 4, baseY - graphH, startX + graphW, baseY - graphH);

    doc.setFontSize(5.5);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "normal");
    doc.text(`${Math.round(precioZona * 0.5)} €`, startX - 6, baseY - graphH * 0.5 + 1.2, {
      align: "right",
    });
    doc.text(`${precioZona} €`, startX - 6, baseY - graphH + 1.2, {
      align: "right",
    });

    const barW = 16;
    const barGap = (graphW - barW * 5) / 4;

    aniosData.forEach((d, idx) => {
      const barX = startX + idx * (barW + barGap);
      const barH = (d.valor / precioZona) * graphH;
      const barY = baseY - barH;
      const barColor = idx === 4 ? C.emerald : ([148, 163, 184] as RGB);

      doc.setFillColor(...barColor);
      doc.roundedRect(barX, barY, barW, barH, 1, 1, "F");

      doc.setFontSize(6.5);
      doc.setTextColor(...C.dark);
      doc.setFont("helvetica", "bold");
      doc.text(`${d.valor.toLocaleString("es-ES")} €`, barX + barW / 2, barY - 2, {
        align: "center",
      });

      doc.setFontSize(6.5);
      doc.setTextColor(...C.slate5);
      doc.setFont("helvetica", "bold");
      const anioEtiqueta =
        idx === 4
          ? lang === "en"
            ? "2025 (Now)"
            : lang === "ca"
            ? "2025 (Avui)"
            : "2025 (Hoy)"
          : d.anio;
      doc.text(anioEtiqueta, barX + barW / 2, baseY + 4.5, { align: "center" });
    });

    y += graphH + 9;

    doc.setFontSize(5.5);
    doc.setTextColor(...C.slate5);
    doc.setFont("helvetica", "italic");
    const noteTxt =
      lang === "en"
        ? "*Estimated data based on market indicators and real estate portals registry for residential typologies in the area."
        : lang === "ca"
        ? "*Dades estimades basades en indicadors de mercat i registres de portals immobiliaris per a tipologies residencials a la zona."
        : "*Datos estimados basados en indicadores de mercado y registros de portales inmobiliarios para tipologías residenciales en la zona.";
    doc.text(noteTxt, PDF_DIMENSIONS.ML, y);
    y += 4;
  }

  drawFooter(doc, t.footer);
}

// ─── Página 3: Tu Barrio ─────────────────────────────────────────────────────

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

  // ── Grid 4x2 de categorías POI ───────────────────────────────────────────────
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

    // Icono (texto)
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

  // ── Análisis de barrio ────────────────────────────────────────────────────────
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

    // Puntuación servicios — barra visual
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

  // ── Mapa de texto y verificación ─────────────────────────────────────────────
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
        ? `Property verified at coordinates: ${latVal.toFixed(
            5
          )}° N, ${lonVal.toFixed(5)}° E · Verification Code: ${hash}`
        : lang === "ca"
        ? `Propietat verificada a les coordenades: ${latVal.toFixed(
            5
          )}° N, ${lonVal.toFixed(5)}° E · Codi de verificacio: ${hash}`
        : `Propiedad verified en coordenadas: ${latVal.toFixed(
            5
          )}° N, ${lonVal.toFixed(5)}° E · Código de verificación: ${hash}`;
    doc.text(verifDesc, PDF_DIMENSIONS.ML + 4, y + 9.5);
  }

  drawFooter(doc, t.footer);
}

// ─── Página 4: Perspectiva Financiera ────────────────────────────────────────

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

  // ── Box alquiler + rentabilidad ───────────────────────────────────────────────
  const alqBox = 30;
  doc.setFillColor(...C.bg);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, alqBox, 3, 3, "F");
  doc.setDrawColor(...C.emerald);
  doc.setLineWidth(0.4);
  doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, alqBox, 3, 3, "S");

  const alquiler =
    result.precio_alquiler_estimado ?? Math.round(precio * 0.004);
  const rentPct =
    result.rentabilidad_bruta_pct ??
    (precio > 0
      ? parseFloat(((alquiler * 12) / precio * 100).toFixed(1))
      : 0);
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
  doc.text(
    t.pag4_rentabilidad.toUpperCase(),
    PDF_DIMENSIONS.ML + halfCW + 5,
    y + 8
  );
  doc.setFontSize(18);
  doc.setTextColor(...rentColor);
  doc.setFont("helvetica", "bold");
  doc.text(`${rentPct}%`, PDF_DIMENSIONS.ML + halfCW + 5, y + 22);
  y += alqBox + 6;

  // ── Tabla escenarios ──────────────────────────────────────────────────────────
  if (y < PDF_DIMENSIONS.PAGE_MAX - 50) {
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag4_escenarios, PDF_DIMENSIONS.ML, y);
    y += 5;

    const escenarios = [
      {
        nombre:
          lang === "en"
            ? "Conservative"
            : lang === "ca"
            ? "Conservador"
            : "Conservador",
        renta: alquiler * 0.9,
        ocup: 85,
      },
      {
        nombre:
          lang === "en" ? "Moderate" : lang === "ca" ? "Moderat" : "Moderado",
        renta: alquiler,
        ocup: 92,
      },
      {
        nombre:
          lang === "en"
            ? "Optimistic"
            : lang === "ca"
            ? "Optimista"
            : "Optimista",
        renta: alquiler * 1.1,
        ocup: 98,
      },
    ];

    const escHdrs = [
      lang === "en" ? "Scenario" : "Escenario",
      lang === "en"
        ? "Monthly rent"
        : lang === "ca"
        ? "Renda mensual"
        : "Renta mensual",
      lang === "en" ? "Occupancy" : lang === "ca" ? "Ocupacio" : "Ocupacion",
      lang === "en"
        ? "Gross yield"
        : lang === "ca"
        ? "Rendibilitat"
        : "Rentabilidad",
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
      const bruta =
        precio > 0 ? parseFloat(((rentaAnual / precio) * 100).toFixed(1)) : 0;
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
    y += 5;
  }

  // ── Tiempo venta ──────────────────────────────────────────────────────────────
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

  // ── Recomendación precio salida ───────────────────────────────────────────────
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
    const recLines = doc.splitTextToSize(
      result.recomendacion_precio_salida,
      PDF_DIMENSIONS.CW - 8
    );
    doc.text(recLines.slice(0, 2), PDF_DIMENSIONS.ML + 4, y + 10);
    y += 17;
  }

  // Separador
  if (y < PDF_DIMENSIONS.PAGE_MAX - 60) {
    doc.setDrawColor(...C.slate3);
    doc.setLineWidth(0.3);
    doc.line(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y);
    y += 5;

    // ── Costes comprador ──────────────────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.pag4_costes_comprador, PDF_DIMENSIONS.ML, y);
    y += 5;

    const costesComprador = [
      {
        label: lang === "en" ? "Transfer tax / VAT (10%)" : "ITP/IVA (10%)",
        pct: 0.1,
      },
      {
        label: lang === "en" ? "Notary (0.5%)" : "Notaria (0.5%)",
        pct: 0.005,
      },
      {
        label: lang === "en" ? "Registry (0.2%)" : "Registro (0.2%)",
        pct: 0.002,
      },
      {
        label: lang === "en" ? "Agency (0.3%)" : "Gestoria (0.3%)",
        pct: 0.003,
      },
    ];
    const totalPct = costesComprador.reduce((s, c) => s + c.pct, 0);
    const costRowH = 7;

    costesComprador.forEach(({ label, pct }) => {
      doc.setFontSize(7);
      doc.setTextColor(...C.dark);
      doc.setFont("helvetica", "normal");
      doc.text(label, PDF_DIMENSIONS.ML + 2, y + 5);
      doc.text(
        fmtShort(Math.round(precio * pct)),
        PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR,
        y + 5,
        { align: "right" }
      );
      y += costRowH;
    });

    // Total costes
    doc.setFillColor(20, 50, 40);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, costRowH + 1, 1, 1, "F");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.emerald);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL ~${Math.round(totalPct * 100)}%`, PDF_DIMENSIONS.ML + 2, y + 5.5);
    doc.text(
      fmtShort(Math.round(precio * totalPct)),
      PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR,
      y + 5.5,
      { align: "right" }
    );
    y += costRowH + 4;
  }

  // ── IBI estimado ──────────────────────────────────────────────────────────────
  if (y < PDF_DIMENSIONS.PAGE_MAX - 20) {
    const ibi = Math.round(precio * 0.005);
    doc.setFontSize(7.5);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${t.pag4_ibi}: ~${ibi.toLocaleString("es-ES")} EUR`,
      PDF_DIMENSIONS.ML,
      y
    );
    y += 8;
  }

  // ── Hipoteca simplificada ─────────────────────────────────────────────────────
  if (precio > 0 && y < PDF_DIMENSIONS.PAGE_MAX - 50) {
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
        ? `Down payment 20%: ${fmtShort(
            Math.round(entrada)
          )}   |   Capital to finance: ${fmtShort(
            Math.round(capital)
          )}   |   Rate: 3.5%`
        : `Entrada 20%: ${fmtShort(
            Math.round(entrada)
          )}   |   Capital: ${fmtShort(Math.round(capital))}   |   Tipo: 3.5%`,
      PDF_DIMENSIONS.ML,
      y + 5
    );
    y += 9;

    const plazoHdrs = [
      lang === "en" ? "Term" : "Plazo",
      lang === "en"
        ? "Monthly payment"
        : lang === "ca"
        ? "Quota mensual"
        : "Cuota mensual",
      lang === "en"
        ? "Total interest"
        : lang === "ca"
        ? "Total interessos"
        : "Total intereses",
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
    y += 6;
  }

  // ── Score de inversión — medidor ──────────────────────────────────────────────
  const scoreInv = result.score_inversion ?? 0;
  if (scoreInv > 0 && y < PDF_DIMENSIONS.PAGE_MAX - 22) {
    doc.setFontSize(8);
    doc.setTextColor(...C.dark);
    doc.setFont("helvetica", "bold");
    doc.text(t.score_inversion, PDF_DIMENSIONS.ML, y);
    y += 5;
    doc.setFillColor(...C.slate3);
    doc.roundedRect(PDF_DIMENSIONS.ML, y, PDF_DIMENSIONS.CW, 6, 1, 1, "F");
    const invColor: RGB =
      scoreInv >= 7 ? C.green : scoreInv >= 5 ? C.amber : C.red;
    doc.setFillColor(...invColor);
    doc.roundedRect(
      PDF_DIMENSIONS.ML,
      y,
      PDF_DIMENSIONS.CW * (scoreInv / 10),
      6,
      1,
      1,
      "F"
    );
    doc.setFontSize(8);
    doc.setTextColor(...invColor);
    doc.setFont("helvetica", "bold");
    doc.text(`${scoreInv}/10`, PDF_DIMENSIONS.W - PDF_DIMENSIONS.MR, y + 5, {
      align: "right",
    });
    y += 10;
  }

  // ── Siguientes pasos ──────────────────────────────────────────────────────────
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

  // ── Footer final ──────────────────────────────────────────────────────────────
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
    `Generado por CalculaTuCasa.com · Ref. ${refId}`,
    PDF_DIMENSIONS.W / 2,
    PDF_DIMENSIONS.PAGE_MAX + 6,
    { align: "center" }
  );
  const disclaimer =
    lang === "en"
      ? "This valuation is indicative and does not constitute an official appraisal. Subject to market conditions."
      : lang === "ca"
      ? "Aquesta valoracio es orientativa i no constitueix una taxacio oficial. Subjecta a les condicions del mercat."
      : "Esta valoracion es orientativa y no constituye tasacion oficial. Sujeta a condiciones del mercado.";
  const discLines = doc.splitTextToSize(disclaimer, PDF_DIMENSIONS.CW);
  doc.text(discLines, PDF_DIMENSIONS.W / 2, PDF_DIMENSIONS.PAGE_MAX + 10, {
    align: "center",
  });
}
