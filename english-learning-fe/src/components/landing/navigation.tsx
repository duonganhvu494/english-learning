import { useEffect, useState } from "react";
import { useAppSettings } from "@/providers/app-settings-provider";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { GraduationCap } from "lucide-react";

export function Navigation() {
  const { dictionary } = useAppSettings();
  const [active, setActive] = useState("features");

  useEffect(() => {
    const updateHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "pricing" || hash === "features") {
        setActive(hash);
      } else {
        setActive("features");
      }
    };
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  return (
    <nav className="border-b bg-app-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-(--color-primary) to-(--color-accent) rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-(--color-text-inverse)" />
            </div>
            <span className="text-xl font-semibold text-app-text">
              {dictionary.appName}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className={
                "text-app-text-muted hover:text-app-text " +
                (active === "features" ? "text-app-text font-bold" : "")
              }
            >
              {dictionary.landing.nav.features}
            </a>
            <a
              href="#pricing"
              className={
                "text-app-text-muted hover:text-app-text " +
                (active === "pricing" ? "text-app-text font-bold" : "")
              }
            >
              {dictionary.landing.nav.pricing}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
