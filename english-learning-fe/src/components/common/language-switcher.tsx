"use client";

import { LOCALES, type Locale } from "@/config/app-settings";
import { useAppSettings } from "@/providers/app-settings-provider";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

function getButtonClass(isActive: boolean) {
  return cn(
    "h-9 rounded-full px-3 text-xs font-semibold normal-case tracking-normal transition-colors",
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
        <Button
          key={option}
          type="button"
          variant={locale === option ? "primary" : "outline"}
          size="sm"
          className={getButtonClass(locale === option)}
          onClick={() => setLocale(option as Locale)}
        >
          {dictionary.options.locales[option]}
        </Button>
      ))}
    </div>
  );
}
