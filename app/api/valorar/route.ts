import { NextResponse } from "next/server";
import { fetchEntorno, EntornoData } from "@/lib/entorno";
import type { RequestBody } from "@/lib/valorar/types";
import { normalizarPropiedad } from "@/lib/valorar/normalizer";
import { obtenerCoordenadas } from "@/lib/valorar/geocoding";
import { buildPrompt } from "@/lib/valorar/prompts";
import {
  callGemini,
  callGeminiBarrio,
  callGeminiEntornoFallback,
} from "@/lib/valorar/geminiClients";
import {
  buscarValoracionEnCache,
  guardarPropiedadEnBD,
  guardarValoracionEnBD,
} from "@/lib/valorar/cache";
import type { ValoracionGemini } from "@/lib/valorar/types";

// ─── Score inversión (sin IA) ────────────────────────────────────────────────

function calcularScoreInversion(
  v: ValoracionGemini,
  entorno: EntornoData,
  cert: string | undefined
): number {
  let score = 5; // base
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
    const rawBody = await req.text();
    let body: RequestBody;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr: unknown) {
      const msg =
        parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error(
        "[api/valorar] JSON parse error:",
        msg,
        "Raw body:",
        rawBody
      );
      return NextResponse.json(
        { error: `JSON Parse Error: ${msg}. Raw body received: [${rawBody}]` },
        { status: 400 }
      );
    }

    const { propiedad: propiedadRaw, testigos = [], lang = "es" } = body;

    if (
      !propiedadRaw?.direccion_completa ||
      !propiedadRaw?.m2_construidos ||
      !propiedadRaw?.estado_conservacion
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios en propiedad" },
        { status: 400 }
      );
    }

    const propiedad = normalizarPropiedad(propiedadRaw);

    const GEMINI_API_KEY =
      process.env.GEMINI_API_KEY_VERTEX || process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error(
        "Variables de entorno no configuradas en el proyecto (Falta GEMINI_API_KEY_VERTEX)"
      );
    }

    // ── Intentar recuperar de caché ──────────────────────────────────────────
    const cacheHit = await buscarValoracionEnCache(propiedad);
    if (cacheHit) {
      return NextResponse.json({
        success: true,
        ...cacheHit,
        coordenadas: null,
      });
    }

    // ── Geocodificación + entorno ────────────────────────────────────────────
    let propiedadId = propiedad.propiedad_id;
    let coordLat: number | null = null;
    let coordLon: number | null = null;
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

    if (!propiedadId) {
      const geoResult = await obtenerCoordenadas(
        propiedad.direccion_completa,
        GEMINI_API_KEY
      );
      if (geoResult) {
        coordLat = geoResult.lat;
        coordLon = geoResult.lon;
        propiedad.direccion_completa = geoResult.enrichedAddress;
        entorno = await fetchEntorno(coordLat, coordLon);
      }

      // Fallback de entorno simulado por Gemini si Overpass no devolvió nada
      const totalPOIs = Object.values(entorno).flat().length;
      if (totalPOIs === 0) {
        console.log(
          "[Entorno] Overpass no devolvió POIs. Usando fallback con Gemini para simular el entorno..."
        );
        const fallbackEntorno = await callGeminiEntornoFallback(
          propiedad.direccion_completa,
          GEMINI_API_KEY
        );
        if (fallbackEntorno) {
          entorno = fallbackEntorno;
          entorno.origen = "gemini_fallback";
          console.log("[Entorno] Fallback de entorno con Gemini cargado con éxito.");
        }
      }

      propiedadId = await guardarPropiedadEnBD(
        propiedad,
        propiedad.direccion_completa,
        entorno
      );
    }

    // ── Valoración Gemini principal ──────────────────────────────────────────
    const promptVal = buildPrompt(propiedad, testigos, lang);
    const valoracion = await callGemini(promptVal, GEMINI_API_KEY);

    // ── Análisis barrio ──────────────────────────────────────────────────────
    const analisisBarrio = await callGeminiBarrio(
      propiedad.direccion_completa,
      entorno,
      GEMINI_API_KEY
    );

    // ── Score inversión ──────────────────────────────────────────────────────
    const scoreInversion = calcularScoreInversion(
      valoracion,
      entorno,
      propiedad.certificado_energetico
    );

    // ── Guardar valoración en PocketBase ─────────────────────────────────────
    const valoracionId = await guardarValoracionEnBD(
      propiedadId || "",
      valoracion,
      scoreInversion,
      analisisBarrio
    );

    return NextResponse.json({
      success: true,
      valoracion_id: valoracionId,
      propiedad_id: propiedadId,
      ...valoracion,
      entorno,
      analisis_barrio: analisisBarrio,
      score_inversion: scoreInversion,
      coordenadas:
        coordLat && coordLon ? { lat: coordLat, lon: coordLon } : null,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/valorar]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
