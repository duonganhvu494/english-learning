"use client";

import { LOCALES, type Locale } from "@/config/app-settings";
import { useAppSettings } from "@/providers/app-settings-provider";
import { cn } from "@/utils/cn";

function getButtonClass(isActive: boolean) {
  return cn(
    "inline-flex h-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition-colors",
    isActive
      ? "bg-[var(--color-primary)] text-[var(--color-text-inverse)]"
      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale, dictionary } = useAppSettings();

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className={getButtonClass(locale === option)}
          onClick={() => setLocale(option as Locale)}
        >
          {dictionary.options.locales[option]}
        </button>
      ))}
    </div>
  );
}
