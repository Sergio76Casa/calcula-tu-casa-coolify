import type { EntornoData, POI } from "@/lib/entorno";
import type { ValuationResult as BaseValuationResult } from "@/components/landing/LoadingValuationStep";

export type { EntornoData, POI };

export interface PropiedadInput {
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

export interface TestigoMercado {
  direccion: string;
  m2: number;
  precio_total: number;
  fuente: string;
}

export interface RequestBody {
  propiedad: PropiedadInput;
  testigos?: TestigoMercado[];
  lang?: string;
}

export interface ValoracionGemini {
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

export interface AnalisisBarrio {
  tipo_barrio: string;
  puntuacion_servicios: number;
  descripcion: string;
  ventajas_ubicacion: string[];
}

export interface ValuationResult extends BaseValuationResult {
  precio_por_m2_zona?: number;
  ajuste_aplicado_pct?: number;
  puntos_fuertes?: string[];
  puntos_a_mejorar?: string[];
  recomendacion_precio_salida?: string;
  precio_alquiler_estimado?: number;
  rentabilidad_bruta_pct?: number;
  tiempo_venta_estimado_dias?: number;
  tendencia_mercado_12m?: number;
  score_inversion?: number;
  coordenadas?: { lat: number; lon: number } | null;
}
