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
  FileText,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/types";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import { getInitials } from "@/utils/get-initials";
import {
  getBasePathByRole,
  getBillingPathByRole,
  getNotificationsPathByRole,
  getProfilePathByRole,
  getSettingsPathByRole,
  STUDENT_BASE_PATH,
  TEACHER_BASE_PATH,
} from "@/utils/app-routes";
import { useMemo, useState } from "react";

type NavKey = "dashboard" | "classes" | "students" | "assignments";

type NavItem = {
  path: string;
  key: NavKey;
  icon: LucideIcon;
};

type UserMenuKey =
  | "menuProfile"
  | "menuSettings"
  | "menuBilling"
  | "menuNotification"
  | "menuHelp";

type UserMenuItem = {
  key: UserMenuKey;
  icon: LucideIcon;
  route?: "profile" | "settings" | "billing" | "notifications";
};

const teacherNavItems: NavItem[] = [
  {
    path: `${TEACHER_BASE_PATH}/dashboard`,
    key: "dashboard",
    icon: LayoutDashboard,
  },
  {
    path: `${TEACHER_BASE_PATH}/classes`,
    key: "classes",
    icon: GraduationCap,
  },
  {
    path: `${TEACHER_BASE_PATH}/students`,
    key: "students",
    icon: Users,
  },
];

const studentNavItems: NavItem[] = [
  {
    path: `${STUDENT_BASE_PATH}/dashboard`,
    key: "dashboard",
    icon: LayoutDashboard,
  },
  {
    path: `${STUDENT_BASE_PATH}/classes`,
    key: "classes",
    icon: GraduationCap,
  },
  {
    path: `${STUDENT_BASE_PATH}/assignments`,
    key: "assignments",
    icon: FileText,
  },
];

const teacherUserMenuItems: UserMenuItem[] = [
  { key: "menuProfile", icon: UserIcon, route: "profile" },
  { key: "menuSettings", icon: Settings, route: "settings" },
  { key: "menuBilling", icon: CreditCard, route: "billing" },
  { key: "menuNotification", icon: Bell, route: "notifications" },
  { key: "menuHelp", icon: CircleHelp },
];

const studentUserMenuItems: UserMenuItem[] = [
  { key: "menuProfile", icon: UserIcon, route: "profile" },
  { key: "menuSettings", icon: Settings, route: "settings" },
  { key: "menuNotification", icon: Bell, route: "notifications" },
  { key: "menuHelp", icon: CircleHelp },
];

function getNavLabel(key: NavKey, dictionary: Dictionary): string {
  if (key === "dashboard") {
    return dictionary.dashboard.title;
  }

  if (key === "classes") {
    return dictionary.classesPage.title;
  }

  if (key === "students") {
    return dictionary.myCourse.overview.statsStudents;
  }

  return dictionary.classDetailPage.navAssignments;
}

export function DashboardHeader() {
  const { dictionary } = useAppSettings();
  const router = useRouter();
  const { user, logout, appRole } = useAuth();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const basePath = getBasePathByRole(appRole);
  const billingPath = getBillingPathByRole(appRole);
  const notificationsPath = getNotificationsPathByRole(appRole);
  const profilePath = getProfilePathByRole(appRole);
  const settingsPath = getSettingsPathByRole(appRole);

  const navItems = useMemo(
    () => (appRole === "student" ? studentNavItems : teacherNavItems),
    [appRole],
  );
  const userMenuItems = useMemo(
    () => (appRole === "student" ? studentUserMenuItems : teacherUserMenuItems),
    [appRole],
  );

  const displayName =
    user?.fullName ||
    user?.userName ||
    (appRole === "student" ? "Student" : "Teacher");
  const displayContact = user?.email || user?.userName || "";
  const initials = getInitials(displayName, appRole === "student" ? "S" : "T");

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
      <div className="flex h-16 w-full items-center px-3 md:px-4">
        <Link
          href={`${basePath}/dashboard`}
          className="flex shrink-0 items-center gap-2"
        >
          <div className="w-8 h-8 bg-(--color-primary) rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-xl text-app-text">
            {dictionary.appName}
          </span>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <nav className="flex items-center gap-2">
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
                    {getNavLabel(item.key, dictionary)}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="ml-auto md:hidden">
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
                        {getNavLabel(item.key, dictionary)}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </details>
        </div>

        <div className="hidden md:ml-auto md:flex md:items-center">
          <div className="relative group">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-auto gap-1 rounded-full border-0 bg-transparent p-1 normal-case tracking-normal hover:bg-app-surface-2"
              aria-label={dictionary.dashboard.userMenuLabel}
            >
              <div className="w-10 h-10 rounded-full bg-(--color-primary) flex items-center justify-center text-white font-medium">
                {initials}
              </div>
              <ChevronDown className="w-4 h-4 text-app-text-muted" />
            </Button>

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
                    const label = dictionary.dashboard[item.key];

                    if (
                      item.route === "profile" ||
                      item.route === "settings" ||
                      item.route === "billing" ||
                      item.route === "notifications"
                    ) {
                      const destination =
                        item.route === "profile"
                          ? profilePath
                          : item.route === "settings"
                            ? settingsPath
                            : item.route === "billing"
                              ? billingPath
                              : notificationsPath;
                      return (
                        <Link
                          key={item.key}
                          href={destination}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-app-text transition-colors hover:bg-app-surface-2"
                        >
                          <Icon className="h-4 w-4 text-app-text-muted" />
                          {label}
                        </Link>
                      );
                    }

                    return (
                      <Button
                        key={item.key}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto w-full justify-start gap-2 border-0 bg-transparent px-3 py-2 text-sm normal-case font-normal tracking-normal text-app-text hover:bg-app-surface-2"
                      >
                        <Icon className="h-4 w-4 text-app-text-muted" />
                        {label}
                      </Button>
                    );
                  })}
                </div>

                <div className="border-t border-app-border p-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="h-auto w-full justify-start gap-2 border-0 bg-transparent px-3 py-2 text-sm normal-case font-normal tracking-normal text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_75%,var(--color-surface)_25%)]"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut
                      ? dictionary.dashboard.logoutLoading
                      : dictionary.dashboard.logout}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
