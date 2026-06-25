import { NextResponse } from "next/server";
import { pbCreate } from "@/lib/pocketbase";
import { fetchEntorno, EntornoData, POI } from "@/lib/entorno";

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface PropiedadInput {
  propiedad_id?: string;
  direccion_completa: string;
  m2_construidos: number;
  estado_conservacion: "nuevo" | "bueno" | "regular" | "a_reformar";
  tipo_propiedad?: "piso" | "casa";
  habitaciones?: number;
  ascensor?: boolean;
  jardin?: boolean;
  certificado_energetico?: string;
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
  lang?: string;
}

interface ValoracionGemini {
  precio_sugerido: number;
  rango_precios: { minimo: number; maximo: number };
  argumentario_venta: string;
  precio_por_m2_zona: number;
  ajuste_aplicado_pct: number;
  puntos_fuertes: string[];
  puntos_a_mejorar: string[];
  recomendacion_precio_salida: string;
  precio_alquiler_estimado: number;
  rentabilidad_bruta_pct: number;
  tiempo_venta_estimado_dias: number;
  tendencia_mercado_12m: number;
}

interface AnalisisBarrio {
  tipo_barrio: string;
  puntuacion_servicios: number;
  descripcion: string;
  ventajas_ubicacion: string[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

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

// ─── Prompt principal ────────────────────────────────────────────────────────

function buildPrompt(
  p: PropiedadInput,
  testigos: TestigoMercado[],
  lang = "es"
): string {
  const fecha = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

  const tipoLabel =
    p.tipo_propiedad === "piso"
      ? "Piso / Apartamento"
      : p.tipo_propiedad === "casa"
      ? "Casa / Chalet"
      : "No especificado";
  const habLabel =
    !p.habitaciones
      ? "No especificado"
      : p.habitaciones >= 4
      ? "4 o más"
      : String(p.habitaciones);
  const extraLine =
    p.tipo_propiedad === "piso" && p.ascensor !== undefined
      ? `  Ascensor    : ${p.ascensor ? "Sí" : "No"}`
      : p.tipo_propiedad === "casa" && p.jardin !== undefined
      ? `  Jardín      : ${p.jardin ? "Sí" : "No"}`
      : "";
  const certLine = p.certificado_energetico
    ? `  Cert. Energético: ${p.certificado_energetico.toUpperCase()}`
    : "";

  return `Eres un tasador inmobiliario certificado con 20 años de experiencia en el mercado residencial español.

Fecha de análisis: ${fecha}. Contexto: mercado residencial español 2025-2026, tipos de interés Euribor ~2.5%, demanda activa especialmente en grandes ciudades y costa mediterránea.

PROPIEDAD A VALORAR:
  Dirección   : ${p.direccion_completa}
  Tipo        : ${tipoLabel}
  Superficie  : ${p.m2_construidos} m² construidos
  Habitaciones: ${habLabel}
  Conservación: ${estadoLabel[p.estado_conservacion] ?? p.estado_conservacion}
${extraLine ? extraLine + "\n" : ""}${certLine ? certLine + "\n" : ""}
TESTIGOS DE MERCADO (propiedades comparables en venta):
${testigosBloque}

INSTRUCCIONES:
1. Analiza los testigos para calcular el precio por m² de la zona.
2. Aplica un coeficiente de ajuste según el estado de conservación y el tipo de propiedad.
3. El número de habitaciones impacta el precio: más habitaciones aumentan el valor relativo por m².
4. Si hay ascensor, aplica una prima positiva (su ausencia puede penalizar hasta un 8% en plantas altas).
5. Si hay jardín o parcela, aplica un incremento del 10-25% según la zona.
6. En el argumentario menciona EXPLÍCITAMENTE cómo el ascensor, jardín o número de habitaciones influye en el precio final.
7. Certificado energético "${p.certificado_energetico ?? "no informado"}":
   - A, B o C → prima del 4-7% sobre el precio base; inclúyelo como punto fuerte en el argumentario.
   - D → impacto neutro; mención breve.
   - E, F o G → descuento del 3-6%; inclúyelo como punto a considerar en el argumentario.
   - "pending" o no informado → no apliques ajuste; si es "pending", recomienda tramitar el certificado.
8. ${lang === "ca" ? "Redacta el campo argumentario_venta en catalán." : lang === "en" ? "Write the argumentario_venta field in English." : "Redacta el campo argumentario_venta en español."}
9. Calcula el precio por m² de la zona basándote en los testigos y devuélvelo en \`precio_por_m2_zona\`.
10. Indica en \`ajuste_aplicado_pct\` el porcentaje de ajuste aplicado sobre el precio base de la zona (positivo si sube, negativo si baja).
11. En \`puntos_fuertes\`, devuelve exactamente 3 frases cortas (máx 12 palabras cada una) sobre aspectos positivos de la propiedad que aumentan su valor.
12. En \`puntos_a_mejorar\`, devuelve 2-3 frases cortas sobre aspectos negativos o que pueden negociarse a la baja.
13. En \`recomendacion_precio_salida\`, una frase: precio de salida recomendado y margen de negociación estimado en %.
14. Estima \`precio_alquiler_estimado\` (renta mensual de mercado en euros para esta propiedad/zona).
15. Calcula \`rentabilidad_bruta_pct\` = (precio_alquiler_estimado * 12 / precio_sugerido) * 100, redondeado a 1 decimal.
16. Estima \`tiempo_venta_estimado_dias\` (días medios para vender un inmueble similar en esa zona, número entero).
17. Estima \`tendencia_mercado_12m\` (variación porcentual esperada del precio en los próximos 12 meses, con signo, ej: 3.5 o -1.2).

RESPONDE EXCLUSIVAMENTE con este objeto JSON, sin texto adicional ni bloques de código:
{
  "precio_sugerido": <entero en euros>,
  "rango_precios": {
    "minimo": <entero en euros>,
    "maximo": <entero en euros>
  },
  "argumentario_venta": "<texto de 3-5 frases mencionando habitaciones, ascensor o jardín y su impacto en el precio>",
  "precio_por_m2_zona": <entero>,
  "ajuste_aplicado_pct": <número con decimales>,
  "puntos_fuertes": ["<frase 1>", "<frase 2>", "<frase 3>"],
  "puntos_a_mejorar": ["<frase 1>", "<frase 2>"],
  "recomendacion_precio_salida": "<frase>",
  "precio_alquiler_estimado": <entero en euros>,
  "rentabilidad_bruta_pct": <número con 1 decimal>,
  "tiempo_venta_estimado_dias": <entero>,
  "tendencia_mercado_12m": <número con 1 decimal>
}`;
}

// ─── Gemini principal ────────────────────────────────────────────────────────

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
        temperature: 0.2,
        responseMimeType: "application/json",
        maxOutputTokens: 2500,
        responseSchema: {
          type: "OBJECT",
          properties: {
            precio_sugerido: { type: "INTEGER" },
            rango_precios: {
              type: "OBJECT",
              properties: {
                minimo: { type: "INTEGER" },
                maximo: { type: "INTEGER" },
              },
              required: ["minimo", "maximo"],
            },
            argumentario_venta: { type: "STRING" },
            precio_por_m2_zona: { type: "INTEGER" },
            ajuste_aplicado_pct: { type: "NUMBER" },
            puntos_fuertes: { type: "ARRAY", items: { type: "STRING" } },
            puntos_a_mejorar: { type: "ARRAY", items: { type: "STRING" } },
            recomendacion_precio_salida: { type: "STRING" },
            precio_alquiler_estimado: { type: "INTEGER" },
            rentabilidad_bruta_pct: { type: "NUMBER" },
            tiempo_venta_estimado_dias: { type: "INTEGER" },
            tendencia_mercado_12m: { type: "NUMBER" },
          },
          required: [
            "precio_sugerido",
            "rango_precios",
            "argumentario_venta",
            "precio_por_m2_zona",
            "ajuste_aplicado_pct",
            "puntos_fuertes",
            "puntos_a_mejorar",
            "recomendacion_precio_salida",
            "precio_alquiler_estimado",
            "rentabilidad_bruta_pct",
            "tiempo_venta_estimado_dias",
            "tendencia_mercado_12m",
          ],
        },
      },
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const payload = await res.json();
  const raw: string = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) throw new Error("Gemini devolvió una respuesta vacía");

  let parsed: ValoracionGemini;
  try {
    parsed = JSON.parse(raw) as ValoracionGemini;
  } catch (parseErr: unknown) {
    const msg = parseErr instanceof Error ? parseErr.message : String(parseErr);
    console.error(
      "[api/valorar] Gemini JSON parse error:",
      msg,
      "Raw output:",
      raw,
      "Full payload:",
      JSON.stringify(payload)
    );
    throw new Error(
      `Gemini JSON Parse Error: ${msg}. Raw output: [${raw}]. Full Gemini payload: ${JSON.stringify(payload)}`
    );
  }

  // Validate required fields
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
    throw new Error("La respuesta de Gemini no cumple el contrato JSON esperado");
  }

  return parsed;
}

// ─── Análisis de barrio ──────────────────────────────────────────────────────

function buildResumenPOIs(entorno: EntornoData): string {
  const categorias: [string, POI[]][] = [
    ["Colegios", entorno.colegios],
    ["Supermercados", entorno.supermercados],
    ["Farmacias", entorno.farmacias],
    ["Transporte", entorno.transporte],
    ["Parques", entorno.parques],
    ["Restaurantes/Cafés", entorno.restaurantes],
    ["Gasolineras", entorno.gasolineras],
    ["Salud", entorno.salud],
  ];

  return categorias
    .filter(([, pois]) => pois.length > 0)
    .map(
      ([cat, pois]) =>
        `${cat}: ${pois.map((p) => `${p.nombre} (${p.distancia_m}m)`).join(", ")}`
    )
    .join("\n");
}

async function callGeminiBarrio(
  direccion: string,
  entorno: EntornoData,
  apiKey: string
): Promise<AnalisisBarrio | null> {
  const resumenPOIs = buildResumenPOIs(entorno);
  if (!resumenPOIs) return null;

  const prompt = `Eres un experto en análisis urbano. Dada la dirección "${direccion}" y estos servicios cercanos:
${resumenPOIs}
Responde SOLO con JSON:
{
  "tipo_barrio": "<descripción en 8-10 palabras>",
  "puntuacion_servicios": <número 1-10>,
  "descripcion": "<2-3 frases sobre el entorno>",
  "ventajas_ubicacion": ["<frase 1>", "<frase 2>", "<frase 3>"]
}`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
          maxOutputTokens: 500,
          responseSchema: {
            type: "OBJECT",
            properties: {
              tipo_barrio: { type: "STRING" },
              puntuacion_servicios: { type: "NUMBER" },
              descripcion: { type: "STRING" },
              ventajas_ubicacion: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: [
              "tipo_barrio",
              "puntuacion_servicios",
              "descripcion",
              "ventajas_ubicacion",
            ],
          },
        },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const payload = await res.json();
    const raw: string = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    return JSON.parse(raw) as AnalisisBarrio;
  } catch (err) {
    console.error("[api/valorar] Gemini barrio error:", err);
    return null;
  }
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: RequestBody;
    try {
      body = JSON.parse(rawBody);
    } catch (parseErr: unknown) {
      const msg =
        parseErr instanceof Error ? parseErr.message : String(parseErr);
      console.error("[api/valorar] JSON parse error:", msg, "Raw body:", rawBody);
      return NextResponse.json(
        {
          error: `JSON Parse Error: ${msg}. Raw body received: [${rawBody}]`,
        },
        { status: 400 }
      );
    }

    const { propiedad, testigos = [], lang = "es" } = body;

    if (
      !propiedad?.direccion_completa ||
      !propiedad?.m2_construidos ||
      !propiedad?.estado_conservacion
    ) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios en propiedad" },
        { status: 400 }
      );
    }

    // Normalizar estado de conservación
    const rawEstado = String(propiedad.estado_conservacion).toLowerCase().trim();
    if (rawEstado.includes("nuevo")) {
      propiedad.estado_conservacion = "nuevo";
    } else if (rawEstado.includes("buen") || rawEstado === "bueno") {
      propiedad.estado_conservacion = "bueno";
    } else if (rawEstado.includes("regular")) {
      propiedad.estado_conservacion = "regular";
    } else if (
      rawEstado.includes("reformar") ||
      rawEstado.includes("reforma") ||
      rawEstado === "a_reformar"
    ) {
      propiedad.estado_conservacion = "a_reformar";
    } else {
      propiedad.estado_conservacion = "bueno";
    }

    // Normalizar m2_construidos
    propiedad.m2_construidos = Number(propiedad.m2_construidos);

    // Normalizar habitaciones
    if (propiedad.habitaciones !== undefined && propiedad.habitaciones !== null) {
      const habsVal = String(propiedad.habitaciones).trim();
      if (
        habsVal === "" ||
        habsVal === "undefined" ||
        habsVal === "null"
      ) {
        propiedad.habitaciones = undefined;
      } else {
        const parsedHabs = parseInt(habsVal, 10);
        propiedad.habitaciones = isNaN(parsedHabs) ? undefined : parsedHabs;
      }
    }

    // Normalizar ascensor
    if (propiedad.ascensor !== undefined && propiedad.ascensor !== null) {
      const ascVal = String(propiedad.ascensor).trim().toLowerCase();
      if (ascVal === "" || ascVal === "undefined" || ascVal === "null") {
        propiedad.ascensor = undefined;
      } else {
        propiedad.ascensor =
          ascVal === "true" || ascVal === "1" || ascVal === "sí" || ascVal === "si";
      }
    }

    // Normalizar jardin
    if (propiedad.jardin !== undefined && propiedad.jardin !== null) {
      const jarVal = String(propiedad.jardin).trim().toLowerCase();
      if (jarVal === "" || jarVal === "undefined" || jarVal === "null") {
        propiedad.jardin = undefined;
      } else {
        propiedad.jardin =
          jarVal === "true" || jarVal === "1" || jarVal === "sí" || jarVal === "si";
      }
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY_VERTEX || process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("Variables de entorno no configuradas en el proyecto (Falta GEMINI_API_KEY_VERTEX)");
    }

    // ── Geocodificación + entorno en paralelo ────────────────────────────────
    let propiedadId = propiedad.propiedad_id;
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
      let enrichedAddress = propiedad.direccion_completa;
      let coordLat: number | null = null;
      let coordLon: number | null = null;

      // Nominatim geocoding
      if (!/\b\d{5}\b/.test(propiedad.direccion_completa)) {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(propiedad.direccion_completa)}&format=json&limit=1&addressdetails=1&countrycodes=es`;
          const geoRes = await fetch(url, {
            headers: { "User-Agent": "CalculaTuCasa/1.0" },
            signal: AbortSignal.timeout(1800),
          });
          if (geoRes.ok) {
            const data = await geoRes.json();
            if (data && data[0]) {
              if (data[0].display_name) {
                enrichedAddress = data[0].display_name;
              }
              if (data[0].lat && data[0].lon) {
                coordLat = parseFloat(data[0].lat);
                coordLon = parseFloat(data[0].lon);
              }
            }
          }
        } catch (err) {
          console.error("[Geocoding error]", err);
        }
      }

      // Fetch entorno si tenemos coordenadas
      if (coordLat !== null && coordLon !== null) {
        entorno = await fetchEntorno(coordLat, coordLon);
      }

      const newProp = await pbCreate("propiedades", {
        direccion_completa: enrichedAddress,
        m2_construidos: propiedad.m2_construidos,
        estado_conservacion: propiedad.estado_conservacion,
        tipo_propiedad: propiedad.tipo_propiedad || null,
        habitaciones: propiedad.habitaciones || null,
        ascensor: propiedad.ascensor ?? null,
        jardin: propiedad.jardin ?? null,
        certificado_energetico: propiedad.certificado_energetico || null,
        entorno_json: JSON.stringify(entorno),
      });
      propiedadId = newProp.id;
      propiedad.direccion_completa = enrichedAddress;
    }

    // ── Valoración Gemini principal ──────────────────────────────────────────
    const valoracion = await callGemini(
      buildPrompt(propiedad, testigos, lang),
      GEMINI_API_KEY
    );

    // ── Análisis barrio (opcional) ───────────────────────────────────────────
    const analisis_barrio = await callGeminiBarrio(
      propiedad.direccion_completa,
      entorno,
      GEMINI_API_KEY
    );

    // ── Score inversión ──────────────────────────────────────────────────────
    const score_inversion = calcularScoreInversion(
      valoracion,
      entorno,
      propiedad.certificado_energetico
    );

    // ── Guardar valoración en PocketBase ─────────────────────────────────────
    const newVal = await pbCreate("valoraciones", {
      propiedad_id: propiedadId,
      precio_sugerido: valoracion.precio_sugerido,
      rango_minimo: valoracion.rango_precios.minimo,
      rango_maximo: valoracion.rango_precios.maximo,
      argumentario_venta: valoracion.argumentario_venta,
      precio_por_m2_zona: valoracion.precio_por_m2_zona,
      ajuste_aplicado_pct: valoracion.ajuste_aplicado_pct,
      puntos_fuertes: JSON.stringify(valoracion.puntos_fuertes),
      puntos_a_mejorar: JSON.stringify(valoracion.puntos_a_mejorar),
      recomendacion_precio_salida: valoracion.recomendacion_precio_salida,
      precio_alquiler_estimado: valoracion.precio_alquiler_estimado,
      rentabilidad_bruta_pct: valoracion.rentabilidad_bruta_pct,
      tiempo_venta_estimado_dias: valoracion.tiempo_venta_estimado_dias,
      tendencia_mercado_12m: valoracion.tendencia_mercado_12m,
      score_inversion,
      analisis_barrio_json: analisis_barrio
        ? JSON.stringify(analisis_barrio)
        : null,
    });

    return NextResponse.json({
      success: true,
      valoracion_id: newVal.id,
      propiedad_id: propiedadId,
      ...valoracion,
      entorno,
      analisis_barrio: analisis_barrio ?? null,
      score_inversion,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/valorar]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
