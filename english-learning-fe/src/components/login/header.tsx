import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeToggle } from "@/components/common/theme-toggle";

export function Header() {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
      <div className="container-app flex justify-end py-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-(--color-border) bg-[color-mix(in_srgb,var(--color-surface)_88%,transparent)] p-1 shadow-sm backdrop-blur">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
