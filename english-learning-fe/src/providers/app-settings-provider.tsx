"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LOCALES,
  STORAGE_KEYS,
  THEMES,
  type Locale,
  type Theme,
} from "@/config/app-settings";
import { DICTIONARIES } from "@/i18n";
import type { Dictionary } from "@/i18n/types";

type AppSettingsContextValue = {
  locale: Locale;
  setLocale: (nextLocale: Locale) => void;
  theme: Theme;
  setTheme: (nextTheme: Theme) => void;
  dictionary: Dictionary;
};

const DEFAULT_LOCALE: Locale = "vi";
const DEFAULT_THEME: Theme = "light";

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

const isTheme = (value: string): value is Theme =>
  THEMES.includes(value as Theme);

const isLocale = (value: string): value is Locale =>
  LOCALES.includes(value as Locale);

const getSystemTheme = (): Theme => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getInitialLocale = (): Locale => {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  const storedLocale = window.localStorage.getItem(STORAGE_KEYS.locale);
  return storedLocale && isLocale(storedLocale) ? storedLocale : DEFAULT_LOCALE;
};

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEYS.theme);
  return storedTheme && isTheme(storedTheme) ? storedTheme : getSystemTheme();
};

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.locale, locale);
  }, [locale]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      locale,
      setLocale,
      theme,
      setTheme,
      dictionary: DICTIONARIES[locale],
    }),
    [locale, theme],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider.");
  }

  return context;
}
