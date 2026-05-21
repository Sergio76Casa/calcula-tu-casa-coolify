import { NextResponse } from "next/server";
import { pbCreate } from "@/lib/pocketbase";

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
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

function buildPrompt(p: PropiedadInput, testigos: TestigoMercado[], lang = "es"): string {
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

  const tipoLabel = p.tipo_propiedad === "piso" ? "Piso / Apartamento" : p.tipo_propiedad === "casa" ? "Casa / Chalet" : "No especificado";
  const habLabel  = !p.habitaciones ? "No especificado" : p.habitaciones >= 4 ? "4 o más" : String(p.habitaciones);
  const extraLine = p.tipo_propiedad === "piso" && p.ascensor !== undefined
    ? `  Ascensor    : ${p.ascensor ? "Sí" : "No"}`
    : p.tipo_propiedad === "casa" && p.jardin !== undefined
    ? `  Jardín      : ${p.jardin ? "Sí" : "No"}`
    : "";
  const certLine  = p.certificado_energetico
    ? `  Cert. Energético: ${p.certificado_energetico.toUpperCase()}`
    : "";

  return `Eres un tasador inmobiliario certificado con 20 años de experiencia en el mercado residencial español.

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

RESPONDE EXCLUSIVAMENTE con este objeto JSON, sin texto adicional ni bloques de código:
{
  "precio_sugerido": <entero en euros>,
  "rango_precios": {
    "minimo": <entero en euros>,
    "maximo": <entero en euros>
  },
  "argumentario_venta": "<texto de 3-5 frases mencionando habitaciones, ascensor o jardín y su impacto en el precio>"
}`;
}

async function callGemini(prompt: string, apiKey: string): Promise<ValoracionGemini> {
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
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

export async function POST(req: Request) {
  try {
    const body: RequestBody = await req.json();
    const { propiedad, testigos = [], lang = "es" } = body;

    if (!propiedad?.direccion_completa || !propiedad?.m2_construidos || !propiedad?.estado_conservacion) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios en propiedad" },
        { status: 400 }
      );
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
    if (!GEMINI_API_KEY) {
      throw new Error("Variables de entorno no configuradas en el proyecto");
    }

    let propiedadId = propiedad.propiedad_id;
    if (!propiedadId) {
      const newProp = await pbCreate("propiedades", {
        direccion_completa:     propiedad.direccion_completa,
        m2_construidos:         propiedad.m2_construidos,
        estado_conservacion:    propiedad.estado_conservacion,
        tipo_propiedad:         propiedad.tipo_propiedad || null,
        habitaciones:           propiedad.habitaciones || null,
        ascensor:               propiedad.ascensor ?? null,
        jardin:                 propiedad.jardin ?? null,
        certificado_energetico: propiedad.certificado_energetico || null,
      });
      propiedadId = newProp.id;
    }

    const valoracion = await callGemini(buildPrompt(propiedad, testigos, lang), GEMINI_API_KEY);

    const newVal = await pbCreate("valoraciones", {
      propiedad_id:       propiedadId,
      precio_sugerido:    valoracion.precio_sugerido,
      rango_minimo:       valoracion.rango_precios.minimo,
      rango_maximo:       valoracion.rango_precios.maximo,
      argumentario_venta: valoracion.argumentario_venta,
    });

    return NextResponse.json({
      success: true,
      valoracion_id: newVal.id,
      propiedad_id: propiedadId,
      ...valoracion,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/valorar]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
