import Link from "next/link";
import type { Dictionary } from "@/i18n/types";
import type { WorkspaceStudentListItem } from "@/types/workspace";
import { getInitials } from "@/utils/get-initials";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardTopStudentsCardProps = {
  students: WorkspaceStudentListItem[];
  isLoading: boolean;
  dashboardDictionary: Dictionary["dashboard"];
  studentsDictionary: Dictionary["studentsPage"];
};

const isActiveStudent = (status: string) => status.toLowerCase() === "active";

export function DashboardTopStudentsCard({
  students,
  isLoading,
  dashboardDictionary,
  studentsDictionary,
}: DashboardTopStudentsCardProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle>{dashboardDictionary.topStudents}</CardTitle>
        <CardDescription>{studentsDictionary.activeStudents}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <p className="text-sm text-app-text-muted">
            {studentsDictionary.loadingStudents}
          </p>
        )}

        {!isLoading && students.length === 0 && (
          <p className="text-sm text-app-text-muted">
            {studentsDictionary.noStudentsYet}
          </p>
        )}

        {students.map((student, index) => {
          const active = isActiveStudent(student.status);
          return (
            <div key={student.studentId} className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-app-surface-2 text-sm font-medium text-app-text">
                {index + 1}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-(--color-primary) to-(--color-secondary) font-medium text-white">
                {getInitials(student.fullName)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium text-app-text">
                    {student.fullName}
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      active
                        ? "border-(--color-success)/30 text-(--color-success)"
                        : "border-app-border text-app-text-muted"
                    }
                  >
                    {student.status}
                  </Badge>
                </div>
                <p className="truncate text-sm text-app-text-muted">
                  {student.email}
                </p>
              </div>
            </div>
          );
        })}

        <Link
          href="/teacher/students"
          className="block w-full pt-2 text-center text-sm font-medium text-(--color-primary) hover:text-(--color-primary-active)"
        >
          {dashboardDictionary.viewAllStudents} -&gt;
        </Link>
      </CardContent>
    </Card>
  );
}
