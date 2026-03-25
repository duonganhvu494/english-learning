"use client";

import { use } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileText,
  LayoutDashboard,
  Users,
} from "lucide-react";
import {
  useClassDetail,
  ClassDetailProvider,
} from "@/components/teacher/class-detail/class-detail-context";
import { getLocaleTag } from "@/components/teacher/class-detail/class-detail-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSettings } from "@/providers/app-settings-provider";
import { getInitials } from "@/utils/get-initials";

type ClassLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    id: string;
  }>;
};

const classNavItems = [
  { segment: "", icon: LayoutDashboard, key: "navDashboard" as const },
  { segment: "students", icon: Users, key: "navStudents" as const },
  { segment: "calendar", icon: Calendar, key: "navCalendar" as const },
  { segment: "assignments", icon: FileText, key: "navAssignments" as const },
];

function ClassLayoutShell({
  classId,
  children,
}: {
  classId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { dictionary, locale } = useAppSettings();
  const { classItem, enrolledStudents, isLoading } = useClassDetail();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);

  if (isLoading) {
    return (
      <Card className="border-app-border bg-app-surface">
        <CardContent className="py-14 text-center text-app-text-muted">
          {classDetailDictionary.loadingClass}
        </CardContent>
      </Card>
    );
  }

  if (!classItem) {
    return (
      <Card className="border-app-border bg-app-surface">
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-xl font-semibold text-app-text">
            {classDetailDictionary.classNotFound}
          </p>
          <div className="mx-auto w-full max-w-xs">
            <Link href="/teacher/classes">
              <Button variant="outline" className="w-full">
                {classDetailDictionary.backToClasses}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const classBasePath = `/teacher/class/${classId}`;

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      <aside className="w-full shrink-0 xl:w-72">
        <div className="space-y-4 xl:sticky xl:top-22">
          <Link href="/teacher/classes">
            <Button variant="outline" className="w-full justify-start">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {classDetailDictionary.backToClasses}
            </Button>
          </Link>

          <Card className="border-app-border bg-app-surface">
            <CardContent className="space-y-4 p-4">
              <div className="flex h-24 w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-2xl font-semibold text-(--color-text-inverse)">
                {getInitials(classItem.className, "C")}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-app-text">
                  {classItem.className}
                </h2>
                <p className="mt-1 text-sm text-app-text-muted">
                  {classItem.description || classDetailDictionary.noDescription}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-app-border bg-app-surface-2 text-app-text-muted"
                >
                  {classDetailDictionary.statusLabel}:{" "}
                  {dictionary.classesPage.statusActive}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-app-border bg-app-surface-2 text-app-text-muted"
                >
                  {classDetailDictionary.levelLabel}:{" "}
                  {dictionary.classesPage.levelBeginner}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-app-text-muted">
                <p>{classDetailDictionary.noSchedule}</p>
                <p>
                  {enrolledStudents.length}{" "}
                  {classDetailDictionary.studentsCountLabel}
                </p>
                <p>
                  {new Date().toLocaleDateString(localeTag, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <nav className="grid gap-2">
            {classNavItems.map((item) => {
              const Icon = item.icon;
              const itemPath = item.segment
                ? `${classBasePath}/${item.segment}`
                : classBasePath;
              const isDashboardItem = item.segment === "";
              const isActive = isDashboardItem
                ? pathname === classBasePath
                : pathname === itemPath || pathname.startsWith(`${itemPath}/`);

              return (
                <Link key={itemPath} href={itemPath}>
                  <Button
                    variant={isActive ? "primary" : "outline"}
                    className={
                      isActive
                        ? "w-full justify-start text-(--color-text-inverse)"
                        : "w-full justify-start"
                    }
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {classDetailDictionary[item.key]}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export default function ClassDetailLayout({
  children,
  params,
}: ClassLayoutProps) {
  const { id } = use(params);

  return (
    <ClassDetailProvider classId={id}>
      <ClassLayoutShell classId={id}>{children}</ClassLayoutShell>
    </ClassDetailProvider>
  );
}
