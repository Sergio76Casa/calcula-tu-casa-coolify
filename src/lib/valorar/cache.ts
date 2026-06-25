import { pbCreate, pbList } from "@/lib/pocketbase";
import type { PropiedadInput, ValoracionGemini, AnalisisBarrio } from "./types";
import type { EntornoData } from "@/lib/entorno";

export interface CacheResult {
  valoracion_id: string;
  propiedad_id: string;
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
  entorno: EntornoData | null;
  analisis_barrio: AnalisisBarrio | null;
  score_inversion: number;
}

export async function buscarValoracionEnCache(
  p: PropiedadInput
): Promise<CacheResult | null> {
  try {
    const cleanAddrQuery = p.direccion_completa.trim().replace(/'/g, "\\'");
    let filterProp = `direccion_completa = '${cleanAddrQuery}' && m2_construidos = ${p.m2_construidos} && estado_conservacion = '${p.estado_conservacion}'`;
    if (p.habitaciones !== undefined) {
      filterProp += ` && habitaciones = ${p.habitaciones}`;
    }
    if (p.ascensor !== undefined) {
      filterProp += ` && ascensor = ${p.ascensor}`;
    }
    if (p.jardin !== undefined) {
      filterProp += ` && jardin = ${p.jardin}`;
    }

    console.log("[Caché] Buscando propiedad existente con filtro:", filterProp);
    const propsExistentes = await pbList("propiedades", filterProp);
    if (propsExistentes && propsExistentes.length > 0) {
      const propDb = propsExistentes[0];
      const filterVal = `propiedad_id = '${propDb.id}'`;
      const valsExistentes = await pbList("valoraciones", filterVal);
      if (valsExistentes && valsExistentes.length > 0) {
        const valDb = valsExistentes[valsExistentes.length - 1];

        let cachedEntornoTemp: EntornoData | null = null;
        if (propDb.entorno_json) {
          try {
            cachedEntornoTemp = JSON.parse(propDb.entorno_json) as EntornoData;
            if (cachedEntornoTemp && !cachedEntornoTemp.origen) {
              cachedEntornoTemp.origen = "overpass";
            }
          } catch (e) {
            console.error("[Caché] Error parseando entorno_json", e);
          }
        }

        // Contamos los POIs
        const totalPOIs = cachedEntornoTemp
          ? Object.values(cachedEntornoTemp).filter(Array.isArray).flat().length
          : 0;

        // Ignoramos la caché si el entorno está vacío (repara datos de fallos antiguos)
        if (totalPOIs > 0) {
          let cachedAnalisisBarrio: AnalisisBarrio | null = null;
          if (valDb.analisis_barrio_json) {
            try {
              cachedAnalisisBarrio = JSON.parse(
                valDb.analisis_barrio_json
              ) as AnalisisBarrio;
            } catch (e) {
              console.error("[Caché] Error parseando analisis_barrio_json", e);
            }
          }

          console.log(
            `[Caché] Coincidencia encontrada. Reutilizando valoración ${valDb.id}`
          );

          return {
            valoracion_id: valDb.id,
            propiedad_id: propDb.id,
            precio_sugerido: valDb.precio_sugerido,
            rango_precios: {
              minimo: valDb.rango_minimo,
              maximo: valDb.rango_maximo,
            },
            argumentario_venta: valDb.argumentario_venta,
            precio_por_m2_zona: valDb.precio_por_m2_zona,
            ajuste_aplicado_pct: valDb.ajuste_aplicado_pct,
            puntos_fuertes: valDb.puntos_fuertes
              ? JSON.parse(valDb.puntos_fuertes)
              : [],
            puntos_a_mejorar: valDb.puntos_a_mejorar
              ? JSON.parse(valDb.puntos_a_mejorar)
              : [],
            recomendacion_precio_salida: valDb.recomendacion_precio_salida,
            precio_alquiler_estimado: valDb.precio_alquiler_estimado,
            rentabilidad_bruta_pct: valDb.rentabilidad_bruta_pct,
            tiempo_venta_estimado_dias: valDb.tiempo_venta_estimado_dias,
            tendencia_mercado_12m: valDb.tendencia_mercado_12m,
            entorno: cachedEntornoTemp,
            analisis_barrio: cachedAnalisisBarrio,
            score_inversion: valDb.score_inversion,
          };
        } else {
          console.log(
            "[Caché] Coincidencia encontrada en BD pero con entorno vacío. Ignoramos la caché para recalcular y reparar los datos."
          );
        }
      }
    }
  } catch (cacheErr) {
    console.error("[Caché] Error buscando en PocketBase:", cacheErr);
  }
  return null;
}

export async function guardarPropiedadEnBD(
  p: PropiedadInput,
  enrichedAddress: string,
  entorno: EntornoData
): Promise<string> {
  const newProp = await pbCreate("propiedades", {
    direccion_completa: enrichedAddress,
    m2_construidos: p.m2_construidos,
    estado_conservacion: p.estado_conservacion,
    tipo_propiedad: p.tipo_propiedad || null,
    habitaciones: p.habitaciones || null,
    ascensor: p.ascensor ?? null,
    jardin: p.jardin ?? null,
    certificado_energetico: p.certificado_energetico || null,
    entorno_json: JSON.stringify(entorno),
  });
  return newProp.id;
}

export async function guardarValoracionEnBD(
  propiedadId: string,
  v: ValoracionGemini,
  scoreInversion: number,
  analisisBarrio: AnalisisBarrio | null
): Promise<string> {
  const newVal = await pbCreate("valoraciones", {
    propiedad_id: propiedadId,
    precio_sugerido: v.precio_sugerido,
    rango_minimo: v.rango_precios.minimo,
    rango_maximo: v.rango_precios.maximo,
    argumentario_venta: v.argumentario_venta,
    precio_por_m2_zona: v.precio_por_m2_zona,
    ajuste_aplicado_pct: v.ajuste_aplicado_pct,
    puntos_fuertes: JSON.stringify(v.puntos_fuertes),
    puntos_a_mejorar: JSON.stringify(v.puntos_a_mejorar),
    recomendacion_precio_salida: v.recomendacion_precio_salida,
    precio_alquiler_estimado: v.precio_alquiler_estimado,
    rentabilidad_bruta_pct: v.rentabilidad_bruta_pct,
    tiempo_venta_estimado_dias: v.tiempo_venta_estimado_dias,
    tendencia_mercado_12m: v.tendencia_mercado_12m,
    score_inversion: scoreInversion,
    analisis_barrio_json: analisisBarrio
      ? JSON.stringify(analisisBarrio)
      : null,
  });
  return newVal.id;
}
