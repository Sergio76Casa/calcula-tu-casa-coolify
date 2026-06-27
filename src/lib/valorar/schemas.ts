// ─── Gemini API Response Schemas ──────────────────────────────────────────────

export const valuationSchema = {
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
} as const;

export const barrioSchema = {
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
} as const;

const poiItemSchema = {
  type: "OBJECT",
  properties: {
    nombre: { type: "STRING" },
    distancia_m: { type: "NUMBER" },
    tipo: { type: "STRING" },
  },
  required: ["nombre", "distancia_m", "tipo"],
} as const;

export const entornoFallbackSchema = {
  type: "OBJECT",
  properties: {
    colegios: { type: "ARRAY", items: poiItemSchema },
    supermercados: { type: "ARRAY", items: poiItemSchema },
    farmacias: { type: "ARRAY", items: poiItemSchema },
    transporte: { type: "ARRAY", items: poiItemSchema },
    parques: { type: "ARRAY", items: poiItemSchema },
    restaurantes: { type: "ARRAY", items: poiItemSchema },
    gasolineras: { type: "ARRAY", items: poiItemSchema },
    salud: { type: "ARRAY", items: poiItemSchema },
  },
  required: [
    "colegios",
    "supermercados",
    "farmacias",
    "transporte",
    "parques",
    "restaurantes",
    "gasolineras",
    "salud",
  ],
} as const;
