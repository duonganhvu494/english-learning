"use client";

import { useAppSettings } from "@/providers/app-settings-provider";

export function ThemeToggle() {
  const { theme, setTheme, dictionary } = useAppSettings();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 text-xs font-semibold text-(--color-text-muted) transition-colors hover:border-(--color-border-strong) hover:bg-(--color-surface-2) hover:text-(--color-text)"
      aria-label="Toggle theme"
    >
      <span className="text-sm">{isDark ? "🌙" : "☀️"}</span>
      <span className="hidden sm:inline">
        {dictionary.options.themes[theme]}
      </span>
    </button>
  );
}
