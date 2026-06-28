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
  actualizarDatosEnBD,
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
    console.log(
      "[Gemini Key Debug] Usando clave API con prefijo:",
      GEMINI_API_KEY ? GEMINI_API_KEY.slice(0, 8) : "NULA"
    );
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

    const userAgent = req.headers.get("user-agent") || "";
    const isManyChat = userAgent.toLowerCase().includes("manychat");

    if (isManyChat) {
      // ── Flujo súper rápido para ManyChat (Evita Timeout de 10s) ─────────────
      // Guardamos la propiedad de inmediato usando la dirección cruda
      if (!propiedadId) {
        propiedadId = await guardarPropiedadEnBD(
          propiedad,
          propiedad.direccion_completa,
          entorno // vacío inicialmente
        );
      }

      const promptVal = buildPrompt(propiedad, testigos, lang);
      const valoracion = await callGemini(promptVal, GEMINI_API_KEY);

      const scoreInversion = calcularScoreInversion(
        valoracion,
        entorno,
        propiedad.certificado_energetico
      );

      const valoracionId = await guardarValoracionEnBD(
        propiedadId || "",
        valoracion,
        scoreInversion,
        null
      );

      return NextResponse.json({
        success: true,
        valoracion_id: valoracionId,
        propiedad_id: propiedadId,
        ...valoracion,
        entorno,
        analisis_barrio: null,
        score_inversion: scoreInversion,
        coordenadas: null,
      });
    }

    // ── Flujo estándar completo para la Web ──────────────────────────────────
    if (!propiedadId) {
      const geoResult = await obtenerCoordenadas(
        propiedad.direccion_completa,
        GEMINI_API_KEY
      );
      if (geoResult) {
        coordLat = geoResult.lat;
        coordLon = geoResult.lon;
        enrichedAddress = geoResult.enrichedAddress;
        entorno = await fetchEntorno(coordLat, coordLon);
      }

      // Fallback de entorno simulado por Gemini si Overpass no devolvió nada
      const totalPOIs = Object.values(entorno).flat().length;
      if (totalPOIs === 0) {
        console.log(
          "[Entorno] Overpass no devolvió POIs. Usando fallback con Gemini para simular el entorno..."
        );
        const fallbackEntorno = await callGeminiEntornoFallback(
          enrichedAddress,
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
        enrichedAddress,
        entorno
      );
    }

    // ── Valoración Gemini principal y Análisis Barrio en paralelo ───────────
    const promptVal = buildPrompt(propiedad, testigos, lang);
    const [valoracion, analisisBarrio] = await Promise.all([
      callGemini(promptVal, GEMINI_API_KEY),
      callGeminiBarrio(enrichedAddress, entorno, GEMINI_API_KEY),
    ]);

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
