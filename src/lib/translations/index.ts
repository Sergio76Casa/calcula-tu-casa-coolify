import { funnelTranslations } from "./funnel";
import { dashboardTranslations } from "./dashboard";
import { adminTranslations } from "./admin";
import { roadmapTranslations } from "./roadmap";

export type Lang    = "es" | "ca" | "en";
export type Variant = "A" | "B";

export const translations = {
  es: {
    ...funnelTranslations.es,
    ...dashboardTranslations.es,
    ...adminTranslations.es,
    ...roadmapTranslations.es,
  },
  ca: {
    ...funnelTranslations.ca,
    ...dashboardTranslations.ca,
    ...adminTranslations.ca,
    ...roadmapTranslations.ca,
  },
  en: {
    ...funnelTranslations.en,
    ...dashboardTranslations.en,
    ...adminTranslations.en,
    ...roadmapTranslations.en,
  },
} as const;

export function T(lang: Lang) { return translations[lang]; }
export type Translations = ReturnType<typeof T>;
