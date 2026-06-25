import type { PropiedadInput } from "./types";

export function normalizarPropiedad(propiedad: PropiedadInput): PropiedadInput {
  const p = { ...propiedad };

  // Normalizar estado de conservación
  const rawEstado = String(p.estado_conservacion || "").toLowerCase().trim();
  if (rawEstado.includes("nuevo")) {
    p.estado_conservacion = "nuevo";
  } else if (rawEstado.includes("buen") || rawEstado === "bueno") {
    p.estado_conservacion = "bueno";
  } else if (rawEstado.includes("regular")) {
    p.estado_conservacion = "regular";
  } else if (
    rawEstado.includes("reformar") ||
    rawEstado.includes("reforma") ||
    rawEstado === "a_reformar"
  ) {
    p.estado_conservacion = "a_reformar";
  } else {
    p.estado_conservacion = "bueno";
  }

  // Normalizar m2_construidos
  p.m2_construidos = Number(p.m2_construidos) || 0;

  // Normalizar habitaciones
  if (p.habitaciones !== undefined && p.habitaciones !== null) {
    const habsVal = String(p.habitaciones).trim();
    if (habsVal === "" || habsVal === "undefined" || habsVal === "null") {
      p.habitaciones = undefined;
    } else {
      const parsedHabs = parseInt(habsVal, 10);
      p.habitaciones = isNaN(parsedHabs) ? undefined : parsedHabs;
    }
  }

  // Normalizar ascensor
  if (p.ascensor !== undefined && p.ascensor !== null) {
    const ascVal = String(p.ascensor).trim().toLowerCase();
    if (ascVal === "" || ascVal === "undefined" || ascVal === "null") {
      p.ascensor = undefined;
    } else {
      p.ascensor =
        ascVal === "true" ||
        ascVal === "1" ||
        ascVal === "sí" ||
        ascVal === "si";
    }
  }

  // Normalizar jardin
  if (p.jardin !== undefined && p.jardin !== null) {
    const jarVal = String(p.jardin).trim().toLowerCase();
    if (jarVal === "" || jarVal === "undefined" || jarVal === "null") {
      p.jardin = undefined;
    } else {
      p.jardin =
        jarVal === "true" ||
        jarVal === "1" ||
        jarVal === "sí" ||
        jarVal === "si";
    }
  }

  return p;
}
