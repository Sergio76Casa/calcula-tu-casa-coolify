import { dashboardEs } from "./dashboard_es";
import { dashboardCa } from "./dashboard_ca";
import { dashboardEn } from "./dashboard_en";

export const dashboardTranslations = {
  es: dashboardEs,
  ca: dashboardCa,
  en: dashboardEn,
} as const;
