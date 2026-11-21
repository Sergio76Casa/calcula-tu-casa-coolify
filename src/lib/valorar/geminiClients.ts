import type { ValoracionGemini, AnalisisBarrio } from "./types";
import type { EntornoData } from "@/lib/entorno";
import {
  buildResumenPOIs,
  buildBarrioPrompt,
  buildEntornoFallbackPrompt,
} from "./prompts";
import { valuationSchema, barrioSchema, entornoFallbackSchema } from "./schemas";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }
  return trimmed;
}

function extractGeminiText(payload: any): string {
  const parts: any[] = payload?.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (typeof part?.text === "string" && !part?.thought && part.text.includes("{")) {
      return part.text;
    }
  }
  return parts[0]?.text ?? "";
}

// Versión ultrarrápida para ManyChat: sin thinking, tokens reducidos
export async function callGeminiManyChat(
  prompt: string,
  apiKey: string
): Promise<ValoracionGemini> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 2000,
        responseSchema: valuationSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(9000),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ManyChat ${res.status}: ${detail}`);
  }

  const payload = await res.json();
  const raw = extractGeminiText(payload);
  if (!raw) throw new Error("Gemini ManyChat devolvió respuesta vacía");

  let parsed: ValoracionGemini;
  try {
    parsed = JSON.parse(extractJsonObject(raw)) as ValoracionGemini;
  } catch (parseErr: unknown) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    throw new Error(`Gemini ManyChat JSON Parse Error: ${msg}`);
  }

  if (
    typeof parsed.precio_sugerido !== "number" ||
    typeof parsed.rango_precios?.minimo !== "number" ||
    typeof parsed.rango_precios?.maximo !== "number" ||
    typeof parsed.argumentario_venta !== "string" ||
    typeof parsed.precio_por_m2_zona !== "number" ||
    typeof parsed.ajuste_aplicado_pct !== "number" ||
    !Array.isArray(parsed.puntos_fuertes) ||
    !Array.isArray(parsed.puntos_a_mejorar) ||
    typeof parsed.recomendacion_precio_salida !== "string" ||
    typeof parsed.precio_alquiler_estimado !== "number" ||
    typeof parsed.rentabilidad_bruta_pct !== "number" ||
    typeof parsed.tiempo_venta_estimado_dias !== "number" ||
    typeof parsed.tendencia_mercado_12m !== "number"
  ) {
    throw new Error("Gemini ManyChat: respuesta no cumple el contrato JSON");
  }

  return parsed;
}

export async function callGemini(
  prompt: string,
  apiKey: string
): Promise<ValoracionGemini> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 3000,
        responseSchema: valuationSchema,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const payload = await res.json();
  const raw = extractGeminiText(payload);

  if (!raw) throw new Error("Gemini devolvió una respuesta vacía");

  let parsed: ValoracionGemini;
  try {
    parsed = JSON.parse(extractJsonObject(raw)) as ValoracionGemini;
  } catch (parseErr: unknown) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error(
      "[GeminiClient] Gemini JSON parse error:",
      msg,
      "Raw output:",
      raw
    );
    throw new Error(`Gemini JSON Parse Error: ${msg}. Raw output: [${raw}].`);
  }

  if (
    typeof parsed.precio_sugerido !== "number" ||
    typeof parsed.rango_precios?.minimo !== "number" ||
    typeof parsed.rango_precios?.maximo !== "number" ||
    typeof parsed.argumentario_venta !== "string" ||
    typeof parsed.precio_por_m2_zona !== "number" ||
    typeof parsed.ajuste_aplicado_pct !== "number" ||
    !Array.isArray(parsed.puntos_fuertes) ||
    !Array.isArray(parsed.puntos_a_mejorar) ||
    typeof parsed.recomendacion_precio_salida !== "string" ||
    typeof parsed.precio_alquiler_estimado !== "number" ||
    typeof parsed.rentabilidad_bruta_pct !== "number" ||
    typeof parsed.tiempo_venta_estimado_dias !== "number" ||
    typeof parsed.tendencia_mercado_12m !== "number"
  ) {
    throw new Error(
      "La respuesta de Gemini no cumple el contrato JSON esperado"
    );
  }

  return parsed;
}

export async function callGeminiBarrio(
  direccion: string,
  entorno: EntornoData,
  apiKey: string
): Promise<AnalisisBarrio | null> {
  const resumenPOIs = buildResumenPOIs(entorno);
  if (!resumenPOIs) return null;

  const prompt = buildBarrioPrompt(direccion, resumenPOIs);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          maxOutputTokens: 2000,
          responseSchema: barrioSchema,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) return null;

    const payload = await res.json();
    const raw = extractGeminiText(payload);
    if (!raw) return null;

    return JSON.parse(extractJsonObject(raw)) as AnalisisBarrio;
  } catch (err) {
    console.error("[GeminiClient] Gemini barrio error:", err);
    return null;
  }
}

export async function callGeminiEntornoFallback(
  direccion: string,
  apiKey: string
): Promise<EntornoData | null> {
  const prompt = buildEntornoFallbackPrompt(direccion);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: "application/json",
          maxOutputTokens: 2000,
          responseSchema: entornoFallbackSchema,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;
    const payload = await res.json();
    const raw = extractGeminiText(payload);
    if (!raw) return null;
    return JSON.parse(extractJsonObject(raw)) as EntornoData;
  } catch (err) {
    console.error("[GeminiClient] Gemini Entorno Fallback error:", err);
    return null;
  }
}
