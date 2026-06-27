import { adminEs } from "./admin_es";
import { adminCa } from "./admin_ca";
import { adminEn } from "./admin_en";

export const adminTranslations = {
  es: adminEs,
  ca: adminCa,
  en: adminEn,
} as const;
