export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const STORAGE_KEYS = {
  locale: "english-learning.locale",
  theme: "english-learning.theme",
} as const;
