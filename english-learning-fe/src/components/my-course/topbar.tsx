"use client";

import { useAppSettings } from "@/providers/app-settings-provider";
import { LanguageSwitcher } from "../common/language-switcher";
import { ThemeToggle } from "../common/theme-toggle";

type TopbarProps = {
  onOpenSidebar: () => void;
};

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { dictionary } = useAppSettings();

  return (
    <header className="sticky top-0 z-20 border-b border-(--color-border) bg-(--color-surface)">
      <div className="flex h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-surface-2) text-(--color-text) lg:hidden"
          aria-label={dictionary.myCourse.topbar.openMenu}
        >
          ☰
        </button>

        <button className="hidden text-[17px] font-medium text-(--color-text) lg:block">
          {dictionary.myCourse.topbar.collapseAllCourses}
        </button>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface-2) p-1 pr-2"
            aria-label={dictionary.myCourse.topbar.profileMenu}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-primary-soft) text-(--color-primary)">
              👩‍🎓
            </div>
            <span className="text-xs text-(--color-text-muted)">▾</span>
          </button>
        </div>
      </div>
    </header>
  );
}
