import type { Locale } from "@/config/app-settings";
import { EN_DICTIONARY } from "@/i18n/dictionaries/en";
import { VI_DICTIONARY } from "@/i18n/dictionaries/vi";
import type { Dictionary } from "@/i18n/types";

export const DICTIONARIES: Record<Locale, Dictionary> = {
  vi: VI_DICTIONARY,
  en: EN_DICTIONARY,
};
