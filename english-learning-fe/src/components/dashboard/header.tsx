"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, GraduationCap, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/providers/app-settings-provider";

const navItems = [
  { path: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { path: "/classes", key: "classes", icon: GraduationCap },
  { path: "/students", key: "students", icon: Users },
];

export function DashboardHeader() {
  const { dictionary } = useAppSettings();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-app-border bg-app-surface">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 mr-6">
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
                  variant={isActive ? "secondary" : "outline"}
                  className="h-10"
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.key === "dashboard"
                    ? dictionary.dashboard.title
                    : item.key === "classes"
                      ? dictionary.myCourse.sidebar.items.myClasses
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
                        variant={isActive ? "secondary" : "outline"}
                        className="w-full justify-start"
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.key === "dashboard"
                          ? dictionary.dashboard.title
                          : item.key === "classes"
                            ? dictionary.myCourse.sidebar.items.myClasses
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
          <div className="text-right text-sm">
            <div className="font-medium text-app-text">Teacher Name</div>
            <div className="text-app-text-muted">instructor@school.com</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-(--color-primary) flex items-center justify-center text-white font-medium">
            TN
          </div>
        </div>
      </div>
    </header>
  );
}
