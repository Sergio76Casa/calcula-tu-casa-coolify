import type { PropertyDetails } from "@/components/landing/PropertyDetailsStep";
import type { Lang } from "./translations";
import { U } from "./uiStrings";
import type {
  ValuationResult,
  TestigoMercado,
  AnalisisBarrio,
  EntornoData,
} from "./valorar/types";

// Re-exportamos para compatibilidad con la vista
export type { ValuationResult, TestigoMercado, AnalisisBarrio, EntornoData };

export async function generatePDF(
  result: ValuationResult,
  details: PropertyDetails,
  address: string,
  lang: Lang,
  userName?: string | null,
  entorno?: EntornoData | null,
  analisisBarrio?: AnalisisBarrio | null,
  testigos?: TestigoMercado[] | null
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const t = U(lang).pdf;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const {
    drawPage0Cover,
    drawPage1Valuation,
    drawPage2Market,
    drawPage3Neighbourhood,
    drawPage4Financial,
  } = await import("./pdf/pdfPages");

  // 1. Portada
  drawPage0Cover(doc, result, details, address, lang, userName);

  // 2. Página 1: Tasación
  doc.addPage();
  drawPage1Valuation(doc, result, details, lang, address);

  // 3. Página 2: Mercado
  doc.addPage();
  drawPage2Market(doc, result, details, testigos, lang, address);

  // 4. Página 3: Tu Barrio
  doc.addPage();
  drawPage3Neighbourhood(doc, result, entorno, analisisBarrio, lang, address);

  // 5. Página 4: Perspectiva Financiera
  doc.addPage();
  drawPage4Financial(doc, result, lang);

  // Guardar documento
  doc.save(`${t.filename}.pdf`);
}
