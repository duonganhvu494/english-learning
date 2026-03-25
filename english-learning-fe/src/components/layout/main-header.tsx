"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Menu,
  ChevronDown,
  User as UserIcon,
  Settings,
  CreditCard,
  Bell,
  CircleHelp,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { getInitials } from "@/utils/get-initials";
import { useState } from "react";

const TEACHER_BASE_PATH = "/teacher";

const navItems = [
  {
    path: `${TEACHER_BASE_PATH}/dashboard`,
    key: "dashboard",
    icon: LayoutDashboard,
  },
  { path: `${TEACHER_BASE_PATH}/classes`, key: "classes", icon: GraduationCap },
  { path: `${TEACHER_BASE_PATH}/students`, key: "students", icon: Users },
];

const userMenuItems = [
  { key: "menuProfile", icon: UserIcon },
  { key: "menuSettings", icon: Settings },
  { key: "menuBilling", icon: CreditCard },
  { key: "menuNotification", icon: Bell },
  { key: "menuHelp", icon: CircleHelp },
] as const;

export function DashboardHeader() {
  const { dictionary } = useAppSettings();
  const router = useRouter();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const displayName = user?.fullName || user?.userName || "Teacher";
  const displayContact = user?.email || user?.userName || "";
  const initials = getInitials(displayName, "T");

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-app-surface">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link
          href={`${TEACHER_BASE_PATH}/dashboard`}
          className="flex items-center gap-2 mr-6"
        >
          <div className="w-8 h-8 bg-(--color-primary) rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl text-app-text">
            {dictionary.appName}
          </span>
        </Link>

        <div className="hidden md:flex flex-1 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path || pathname.startsWith(item.path);

            return (
              <Link key={item.key} href={item.path}>
                <Button
                  variant={isActive ? "primary" : "outline"}
                  className={
                    isActive ? "h-10 text-(--color-text-inverse)" : "h-10"
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.key === "dashboard"
                    ? dictionary.dashboard.title
                    : item.key === "classes"
                      ? dictionary.classesPage.title
                      : dictionary.myCourse.overview.statsStudents}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="md:hidden ml-auto">
          <details className="relative">
            <summary className="list-none">
              <Button variant="outline" className="p-2">
                <Menu className="w-5 h-5" />
              </Button>
            </summary>
            <div className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-app-border bg-app-surface p-3 shadow-lg">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.path || pathname.startsWith(item.path);
                  return (
                    <Link key={item.key} href={item.path}>
                      <Button
                        variant={isActive ? "primary" : "outline"}
                        className={
                          isActive
                            ? "w-full justify-start text-(--color-text-inverse)"
                            : "w-full justify-start"
                        }
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.key === "dashboard"
                          ? dictionary.dashboard.title
                          : item.key === "classes"
                            ? dictionary.classesPage.title
                            : dictionary.myCourse.overview.statsStudents}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </details>
        </div>

        <div className="hidden md:flex items-center gap-2 ml-auto">
          <LanguageSwitcher />
          <ThemeToggle />

          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-app-surface-2 hover:cursor-pointer"
              aria-label={dictionary.dashboard.userMenuLabel}
            >
              <div className="w-10 h-10 rounded-full bg-(--color-primary) flex items-center justify-center text-white font-medium">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-app-text-muted" />
            </button>

            <div className="invisible opacity-0 pointer-events-none absolute right-0 top-full z-50 w-64 pt-2 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100 group-focus-within:pointer-events-auto">
              <div className="rounded-lg border border-app-border bg-app-surface shadow-lg">
                <div className="border-b border-app-border px-3 py-3">
                  <p className="text-sm font-medium text-app-text">
                    {displayName}
                  </p>
                  <p className="mt-1 text-xs text-app-text-muted">
                    {displayContact}
                  </p>
                </div>

                <div className="p-2">
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-app-text transition-colors hover:bg-app-surface-2"
                      >
                        <Icon className="h-4 w-4 text-app-text-muted" />
                        {dictionary.dashboard[item.key]}
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-app-border p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-(--color-error) transition-colors hover:bg-[color-mix(in_srgb,var(--color-error-soft)_75%,var(--color-surface)_25%)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut
                      ? dictionary.dashboard.logoutLoading
                      : dictionary.dashboard.logout}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
