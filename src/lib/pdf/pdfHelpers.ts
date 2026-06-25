import type { Lang } from "../translations";

export function stripEmoji(s: string): string {
  return s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "").trim();
}

export function fmt(n: number): string {
  return n.toLocaleString("es-ES") + " EUR";
}

export function fmtShort(n: number): string {
  return n.toLocaleString("es-ES") + " EUR";
}

export function energyImpactMsg(cert: string, lang: Lang): string {
  if (lang === "en") {
    if ("AB".includes(cert))
      return "High energy efficiency — can increase sale value by 5-10%.";
    if ("CD".includes(cert))
      return "Medium efficiency — standard for properties of this age and area.";
    return "Low efficiency — may result in a discount of up to 5% on the sale price.";
  }
  if (lang === "ca") {
    if ("AB".includes(cert))
      return "Alta eficiencia energetica — pot incrementar el valor de venda un 5-10%.";
    if ("CD".includes(cert))
      return "Eficiencia mitja — estandard per a propietats de la zona i antiguitat.";
    return "Baixa eficiencia — pot suposar un descompte de fins a un 5% en el preu de venda.";
  }
  if ("AB".includes(cert))
    return "Alta eficiencia energetica — puede incrementar el valor de venta un 5-10%.";
  if ("CD".includes(cert))
    return "Eficiencia media — estandar para propiedades de la zona y antiguedad.";
  return "Baja eficiencia — puede suponer un descuento de hasta un 5% en el precio de venta.";
}

// Cuota hipotecaria mensual (formula francesa)
export function cuotaMensual(
  capital: number,
  tasaAnual: number,
  anios: number
): number {
  const r = tasaAnual / 12;
  const n = anios * 12;
  return (capital * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}
