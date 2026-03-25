import Link from "next/link";
import { GraduationCap, Users } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Class as DashboardClass } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardRecentClassesCardProps = {
  classes: DashboardClass[];
  isLoading: boolean;
  dashboardDictionary: Dictionary["dashboard"];
  studentsLabel: string;
};

export function DashboardRecentClassesCard({
  classes,
  isLoading,
  dashboardDictionary,
  studentsLabel,
}: DashboardRecentClassesCardProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle>{dashboardDictionary.activeClassesList}</CardTitle>
        <CardDescription>{dashboardDictionary.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-sm text-app-text-muted">
            {dashboardDictionary.activeClasses}...
          </p>
        )}

        {!isLoading && classes.length === 0 && (
          <p className="text-sm text-app-text-muted">
            {dashboardDictionary.activeClasses}: 0
          </p>
        )}

        {classes.map((classItem) => (
          <Link key={classItem.id} href={`/teacher/class/${classItem.id}`}>
            <div className="cursor-pointer rounded-lg p-3 transition-colors hover:bg-app-surface-2">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: classItem.color }}
                >
                  <GraduationCap className="h-6 w-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="truncate font-medium text-app-text">
                      {classItem.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {classItem.level}
                    </Badge>
                  </div>

                  <p className="mb-1 text-sm text-app-text-muted">
                    {classItem.schedule || classItem.description}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-app-text-muted">
                    <Users className="h-3 w-3" />
                    {classItem.studentCount} {studentsLabel}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        <Link
          href="/teacher/classes"
          className="block w-full pt-2 text-center text-sm font-medium text-(--color-primary) hover:text-(--color-primary-active)"
        >
          {dashboardDictionary.viewAllClasses} -&gt;
        </Link>
      </CardContent>
    </Card>
  );
}
