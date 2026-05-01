// supabase/functions/valorar-propiedad/index.ts
// Edge Function: recibe datos de propiedad + testigos de mercado,
// llama a Gemini de forma segura y persiste la valoración en Supabase.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface PropiedadInput {
  propiedad_id: string;
  direccion_completa: string;
  m2_construidos: number;
  estado_conservacion: "nuevo" | "bueno" | "regular" | "a_reformar";
}

interface TestigoMercado {
  direccion: string;
  m2: number;
  precio_total: number;
  fuente: string;
}

interface RequestBody {
  propiedad: PropiedadInput;
  testigos?: TestigoMercado[];
}

// Contrato de respuesta obligatorio que Gemini debe devolver
interface ValoracionGemini {
  precio_sugerido: number;
  rango_precios: { minimo: number; maximo: number };
  argumentario_venta: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const JSON_HEADER = { ...CORS, "Content-Type": "application/json" };

// ─── Construcción del prompt ──────────────────────────────────────────────────

function buildPrompt(p: PropiedadInput, testigos: TestigoMercado[]): string {
  const estadoLabel: Record<string, string> = {
    nuevo: "Nuevo / primera entrega",
    bueno: "Buen estado de conservación",
    regular: "Estado regular, mejoras menores",
    a_reformar: "Necesita reforma integral",
  };

  const testigosBloque =
    testigos.length > 0
      ? testigos
          .map(
            (t) =>
              `  • ${t.direccion} | ${t.m2}m² | €${t.precio_total.toLocaleString("es-ES")} | ${t.fuente}`
          )
          .join("\n")
      : "  • Sin testigos disponibles para esta zona.";

  return `Eres un tasador inmobiliario certificado con 20 años de experiencia en el mercado residencial español.

PROPIEDAD A VALORAR:
  Dirección   : ${p.direccion_completa}
  Superficie  : ${p.m2_construidos} m² construidos
  Conservación: ${estadoLabel[p.estado_conservacion] ?? p.estado_conservacion}

TESTIGOS DE MERCADO (propiedades comparables en venta):
${testigosBloque}

INSTRUCCIONES:
1. Analiza los testigos para calcular el precio por m² de la zona.
2. Aplica un coeficiente de ajuste según el estado de conservación.
3. Genera un argumentario de venta profesional y persuasivo.

RESPONDE EXCLUSIVAMENTE con este objeto JSON, sin texto adicional ni bloques de código:
{
  "precio_sugerido": <entero en euros>,
  "rango_precios": {
    "minimo": <entero en euros>,
    "maximo": <entero en euros>
  },
  "argumentario_venta": "<texto de 3-5 frases para el agente inmobiliario>"
}`;
}

// ─── Cliente Gemini ───────────────────────────────────────────────────────────

async function callGemini(
  prompt: string,
  apiKey: string
): Promise<ValoracionGemini> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,          // baja temperatura = respuesta más determinista
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const payload = await res.json();
  const raw: string = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) throw new Error("Gemini devolvió una respuesta vacía");

  const parsed = JSON.parse(raw) as ValoracionGemini;

  // Validación del contrato de respuesta
  if (
    typeof parsed.precio_sugerido !== "number" ||
    typeof parsed.rango_precios?.minimo !== "number" ||
    typeof parsed.rango_precios?.maximo !== "number" ||
    typeof parsed.argumentario_venta !== "string"
  ) {
    throw new Error("La respuesta de Gemini no cumple el contrato JSON esperado");
  }

  return parsed;
}

// ─── Handler principal ────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers: JSON_HEADER,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { propiedad, testigos = [] } = body;

    if (!propiedad?.propiedad_id || !propiedad?.direccion_completa || !propiedad?.m2_construidos) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios en propiedad" }),
        { status: 400, headers: JSON_HEADER }
      );
    }

    // Las claves NUNCA salen del servidor
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Variables de entorno no configuradas en el proyecto");
    }

    // Llamada segura a Gemini
    const valoracion = await callGemini(buildPrompt(propiedad, testigos), GEMINI_API_KEY);

    // Persistencia con service_role (bypassa RLS — solo permitido server-side)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data, error } = await supabase
      .from("valoraciones")
      .insert({
        propiedad_id: propiedad.propiedad_id,
        precio_estimado: valoracion.precio_sugerido,
        analisis_gemini: valoracion,          // JSONB completo
      })
      .select("id")
      .single();

    if (error) throw new Error(`Supabase insert: ${error.message}`);

    return new Response(
      JSON.stringify({ success: true, valoracion_id: data.id, ...valoracion }),
      { status: 200, headers: JSON_HEADER }
    );

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[valorar-propiedad]", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: JSON_HEADER,
    });
  }
});
