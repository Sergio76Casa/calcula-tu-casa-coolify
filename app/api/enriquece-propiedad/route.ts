import { NextResponse } from "next/server";
import { fetchEntorno, EntornoData } from "@/lib/entorno";
import { obtenerCoordenadas } from "@/lib/valorar/geocoding";
import { callGeminiBarrio, callGeminiEntornoFallback } from "@/lib/valorar/geminiClients";
import { pbClient } from "@/lib/pocketbase-client";
import { pbUpdate, pbList } from "@/lib/pocketbase";

// Helper to calculate score
function calcularScoreInversion(
  v: any,
  entorno: EntornoData,
  cert: string | undefined
): number {
  let score = 5;
  if (v.rentabilidad_bruta_pct >= 6) score += 2;
  else if (v.rentabilidad_bruta_pct >= 4) score += 1;
  if (v.tendencia_mercado_12m > 2) score += 1;
  if (cert && "AB".includes(cert.toUpperCase())) score += 1;
  if (cert && "EFG".includes(cert.toUpperCase())) score -= 1;
  const totalPOIs = Object.values(entorno).flat().length;
  if (totalPOIs > 15) score += 1;
  else if (totalPOIs < 5) score -= 1;
  return Math.max(1, Math.min(10, Math.round(score)));
}

export async function POST(req: Request) {
  try {
    const { propiedadId, valoracionId } = await req.json();

    if (!propiedadId || !valoracionId) {
      return NextResponse.json({ error: "Faltan IDs requeridos" }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY_VERTEX || process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: "Falta API Key" }, { status: 500 });
    }

    // 1. Obtener la propiedad y la valoración actuales de PocketBase
    const props = await pbList("propiedades", `id = '${propiedadId}'`);
    const vals = await pbList("valoraciones", `id = '${valoracionId}'`);

    if (props.length === 0 || vals.length === 0) {
      return NextResponse.json({ error: "No se encontraron los registros" }, { status: 404 });
    }

    const propiedad = props[0];
    const valoracion = vals[0];

    // 2. Ejecutar geocodificación
    let coordLat: number | null = null;
    let coordLon: number | null = null;
    let enrichedAddress = propiedad.direccion_completa;
    let entorno: EntornoData = {
      colegios: [],
      supermercados: [],
      farmacias: [],
      transporte: [],
      parques: [],
      restaurantes: [],
      gasolineras: [],
      salud: [],
    };

    const geoResult = await obtenerCoordenadas(propiedad.direccion_completa, GEMINI_API_KEY);
    if (geoResult) {
      coordLat = geoResult.lat;
      coordLon = geoResult.lon;
      enrichedAddress = geoResult.enrichedAddress;
      entorno = await fetchEntorno(coordLat, coordLon);
    }

    // Fallback de entorno
    const totalPOIs = Object.values(entorno).flat().length;
    if (totalPOIs === 0) {
      const fallbackEntorno = await callGeminiEntornoFallback(enrichedAddress, GEMINI_API_KEY);
      if (fallbackEntorno) {
        entorno = fallbackEntorno;
        entorno.origen = "gemini_fallback";
      }
    }

    // 3. Ejecutar análisis del barrio
    const analisisBarrio = await callGeminiBarrio(enrichedAddress, entorno, GEMINI_API_KEY);

    // 4. Recalcular score de inversión
    const scoreInversion = calcularScoreInversion(
      valoracion,
      entorno,
      propiedad.certificado_energetico
    );

    // 5. Actualizar la base de datos
    await pbUpdate("propiedades", propiedadId, {
      direccion_completa: enrichedAddress,
      entorno_json: JSON.stringify(entorno),
    });

    await pbUpdate("valoraciones", valoracionId, {
      score_inversion: scoreInversion,
      analisis_barrio_json: analisisBarrio ? JSON.stringify(analisisBarrio) : null,
    });

    return NextResponse.json({
      success: true,
      entorno,
      analisis_barrio: analisisBarrio,
      score_inversion: scoreInversion,
      direccion_completa: enrichedAddress,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/enriquece-propiedad]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
