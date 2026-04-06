"use client";

import { Moon, Sun } from "lucide-react";
import { useAppSettings } from "@/providers/app-settings-provider";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, dictionary } = useAppSettings();
  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "h-9 gap-2 rounded-full border-(--color-border) bg-(--color-surface) px-3 text-xs font-semibold normal-case tracking-normal transition-colors hover:border-(--color-border-strong) hover:bg-(--color-surface-2) hover:text-(--color-text)",
        "text-(--color-text-muted)",
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
    </Button>
  );
}
