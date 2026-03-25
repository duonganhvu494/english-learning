"use client";

import { Moon, Sun } from "lucide-react";
import { useAppSettings } from "@/providers/app-settings-provider";
import { cn } from "@/utils/cn";

export function ThemeToggle() {
  const { theme, setTheme, dictionary } = useAppSettings();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "inline-flex h-9 items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 text-xs font-semibold transition-colors hover:border-(--color-border-strong) hover:bg-(--color-surface-2) hover:text-(--color-text)",
        "text-(--color-text-muted) hover:cursor-pointer",
      )}
      aria-label="Toggle theme"
    >
      <Sun className="w-4 h-4 dark:hidden" />
      <Moon className="hidden w-4 h-4 dark:inline" />
      <span className="hidden sm:inline dark:hidden">
        {dictionary.options.themes.light}
      </span>
      <span className="hidden dark:sm:inline">
        {dictionary.options.themes.dark}
      </span>
    </button>
  );
}
