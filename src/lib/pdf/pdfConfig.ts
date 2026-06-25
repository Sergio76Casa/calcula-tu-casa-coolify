import { LOGO_BASE64 } from "../logoBase64";

export type RGB = [number, number, number];

export const C = {
  dark: [15, 23, 42] as RGB,
  emerald: [52, 211, 153] as RGB,
  slate5: [100, 116, 139] as RGB,
  slate3: [203, 213, 225] as RGB,
  white: [255, 255, 255] as RGB,
  bg: [248, 250, 252] as RGB,
  amber: [245, 158, 11] as RGB,
  red: [239, 68, 68] as RGB,
  blue: [59, 130, 246] as RGB,
  green: [34, 197, 94] as RGB,
};

export const ENERGY_RGB: Record<string, RGB> = {
  A: [22, 101, 52],
  B: [21, 128, 61],
  C: [77, 124, 15],
  D: [161, 98, 7],
  E: [154, 52, 18],
  F: [185, 28, 28],
  G: [127, 29, 29],
};

export const PDF_DIMENSIONS = {
  W: 210,
  H: 297,
  ML: 15,
  MR: 15,
  CW: 210 - 15 - 15, // 180
  PAGE_MAX: 283,
};

export { LOGO_BASE64 };
