import { FileText } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import type { Class as DashboardClass, Project } from "@/types/types";
import { Progress } from "@/components/dashboard/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type DashboardUpcomingProjectsCardProps = {
  projects: Project[];
  classes: DashboardClass[];
  locale: string;
  dashboardDictionary: Dictionary["dashboard"];
};

export function DashboardUpcomingProjectsCard({
  projects,
  classes,
  locale,
  dashboardDictionary,
}: DashboardUpcomingProjectsCardProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle>{dashboardDictionary.upcomingProjects}</CardTitle>
        <CardDescription>{dashboardDictionary.pendingWork}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.length === 0 && (
            <p className="text-sm text-app-text-muted">
              {dashboardDictionary.pendingWork}: 0
            </p>
          )}

          {projects.map((project) => {
            const classItem = classes.find((item) => item.id === project.classId);
            const submissionRate = Math.round(
              (project.submittedCount / project.totalStudents) * 100,
            );

            return (
              <div
                key={project.id}
                className="flex flex-col gap-4 rounded-lg border border-app-border p-4 md:flex-row md:items-center"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: classItem?.color || "#8B5CF6" }}
                >
                  <FileText className="h-6 w-6" />
                </div>

                <div className="flex-1">
                  <h3 className="mb-1 font-medium text-app-text">
                    {project.title}
                  </h3>
                  <p className="mb-2 text-sm text-app-text-muted">
                    {classItem?.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-app-text-muted">
                    <span>
                      {dashboardDictionary.due}:{" "}
                      {new Date(project.dueDate).toLocaleDateString(locale, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>
                      {dashboardDictionary.submitted}: {project.submittedCount}/
                      {project.totalStudents} ({submissionRate}%)
                    </span>
                  </div>
                </div>

                <Progress value={submissionRate} className="h-2 w-full md:w-24" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
