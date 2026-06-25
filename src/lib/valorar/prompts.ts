import type { PropiedadInput, TestigoMercado } from "./types";
import type { EntornoData } from "@/lib/entorno";

export function buildPrompt(
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
8. ${
    lang === "ca"
      ? "Redacta el campo argumentario_venta en catalán."
      : lang === "en"
      ? "Write the argumentario_venta field in English."
      : "Redacta el campo argumentario_venta en español."
  }
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

export function buildResumenPOIs(entorno: EntornoData): string {
  const categorias: [string, { nombre: string; distancia_m: number }[]][] = [
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
        `${cat}: ${pois
          .map((p) => `${p.nombre} (${p.distancia_m}m)`)
          .join(", ")}`
    )
    .join("\n");
}

export function buildBarrioPrompt(
  direccion: string,
  resumenPOIs: string
): string {
  return `Eres un experto en análisis urbano. Dada la dirección "${direccion}" y estos servicios cercanos:
${resumenPOIs}
Responde SOLO con JSON:
{
  "tipo_barrio": "<descripción en 8-10 palabras>",
  "puntuacion_servicios": <número 1-10>,
  "descripcion": "<2-3 frases sobre el entorno>",
  "ventajas_ubicacion": ["<frase 1>", "<frase 2>", "<frase 3>"]
}`;
}

export function buildEntornoFallbackPrompt(direccion: string): string {
  return `Eres un experto local en urbanismo y geografía de España.
Dada la dirección "${direccion}", simula de manera muy realista y verosímil los servicios/comercios/puntos de interés (POIs) más cercanos para cada una de las siguientes categorías en España:
- colegios
- supermercados
- farmacias
- transporte
- parques
- restaurantes
- gasolineras
- salud

Para cada categoría, proporciona 2 o 3 servicios con nombres verosímiles en esa zona o municipio, y distancias realistas en metros (entre 50 y 900 metros).
Responde únicamente con un objeto JSON válido con el siguiente formato exacto:
{
  "colegios": [
    { "nombre": "<nombre verosímil>", "distancia_m": <número>, "tipo": "school" }
  ],
  "supermercados": [
    { "nombre": "<nombre verosímil>", "distancia_m": <número>, "tipo": "supermarket" }
  ],
  "farmacias": [
    { "nombre": "Farmacia <nombre/calle>", "distancia_m": <número>, "tipo": "pharmacy" }
  ],
  "transporte": [
    { "nombre": "<metro/bus/tren>", "distancia_m": <número>, "tipo": "bus_stop" }
  ],
  "parques": [
    { "nombre": "<parque/plaza>", "distancia_m": <número>, "tipo": "park" }
  ],
  "restaurantes": [
    { "nombre": "<cafetería/restaurante>", "distancia_m": <número>, "tipo": "restaurant" }
  ],
  "gasolineras": [
    { "nombre": "<gasolinera>", "distancia_m": <número>, "tipo": "fuel" }
  ],
  "salud": [
    { "nombre": "<centro de salud/hospital>", "distancia_m": <número>, "tipo": "hospital" }
  ]
}
Responde SOLO con el JSON.`;
}
