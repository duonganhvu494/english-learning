"use client";

import { useMemo } from "react";
import { Calendar, FileText, TrendingUp, Users } from "lucide-react";
import { useClassDetail } from "@/components/teacher/class-detail/class-detail-context";
import {
  buildClassStudentMetric,
  getDaysUntil,
  getLocaleTag,
  sortStudentsByProgress,
} from "@/components/teacher/class-detail/class-detail-utils";
import { Progress } from "@/components/teacher/dashboard/progress";
import { useData } from "@/mock-data/dataContext";
import { useAppSettings } from "@/providers/app-settings-provider";
import { getInitials } from "@/utils/get-initials";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ClassDashboardPage() {
  const { dictionary, locale } = useAppSettings();
  const { classId, classItem, enrolledStudents } = useClassDetail();
  const { assignments, calendarEvents } = useData();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);

  const classAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.classId === classId),
    [assignments, classId],
  );

  const upcomingEvents = useMemo(() => {
    return [...calendarEvents]
      .filter((event) => event.classId === classId)
      .filter((event) => {
        const daysUntil = getDaysUntil(event.date);
        return typeof daysUntil === "number" && daysUntil >= 0;
      })
      .sort(
        (eventA, eventB) =>
          new Date(eventA.date).getTime() - new Date(eventB.date).getTime(),
      )
      .slice(0, 5);
  }, [calendarEvents, classId]);

  const metricByStudentId = useMemo(() => {
    return new Map(
      enrolledStudents.map((student) => [
        student.studentId,
        buildClassStudentMetric(student.studentId, classAssignments),
      ]),
    );
  }, [classAssignments, enrolledStudents]);

  const averageProgress = useMemo(() => {
    if (enrolledStudents.length === 0) {
      return 0;
    }

    const totalProgress = enrolledStudents.reduce((sum, student) => {
      return sum + (metricByStudentId.get(student.studentId)?.progress ?? 0);
    }, 0);

    return Math.round(totalProgress / enrolledStudents.length);
  }, [enrolledStudents, metricByStudentId]);

  const activeAssignments = useMemo(
    () =>
      classAssignments.filter((assignment) => assignment.status === "Published")
        .length,
    [classAssignments],
  );

  const topStudents = useMemo(
    () =>
      sortStudentsByProgress(
        enrolledStudents,
        (studentId) =>
          metricByStudentId.get(studentId) || {
            progress: 0,
            completedProjects: 0,
            submittedAssignments: 0,
            gradedAssignments: 0,
          },
      ).slice(0, 5),
    [enrolledStudents, metricByStudentId],
  );

  if (!classItem) {
    return null;
  }

  const stats = [
    {
      title: classDetailDictionary.totalStudents,
      value: String(enrolledStudents.length),
      icon: Users,
      iconClassName: "text-(--color-info)",
      iconBackgroundClassName:
        "bg-[color-mix(in_srgb,var(--color-info-soft)_82%,var(--color-surface)_18%)]",
    },
    {
      title: classDetailDictionary.activeAssignments,
      value: String(activeAssignments),
      icon: FileText,
      iconClassName: "text-(--color-primary)",
      iconBackgroundClassName:
        "bg-[color-mix(in_srgb,var(--color-primary-soft)_82%,var(--color-surface)_18%)]",
    },
    {
      title: classDetailDictionary.averageProgress,
      value: `${averageProgress}%`,
      icon: TrendingUp,
      iconClassName: "text-(--color-success)",
      iconBackgroundClassName:
        "bg-[color-mix(in_srgb,var(--color-success-soft)_82%,var(--color-surface)_18%)]",
    },
    {
      title: classDetailDictionary.upcomingEvents,
      value: String(upcomingEvents.length),
      icon: Calendar,
      iconClassName: "text-(--color-warning)",
      iconBackgroundClassName:
        "bg-[color-mix(in_srgb,var(--color-warning-soft)_82%,var(--color-surface)_18%)]",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-app-text">
          {classDetailDictionary.dashboardTitle}
        </h1>
        <p className="text-app-text-muted">
          {classDetailDictionary.dashboardDescription.replace(
            "{name}",
            classItem.className,
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.title} className="border-app-border bg-app-surface">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-app-text-muted">
                  {stat.title}
                </CardTitle>
                <div
                  className={`rounded-lg p-2 ${stat.iconBackgroundClassName}`}
                >
                  <Icon className={`h-4 w-4 ${stat.iconClassName}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-app-text">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-app-border bg-app-surface">
          <CardHeader>
            <CardTitle>{classDetailDictionary.studentPerformance}</CardTitle>
            <CardDescription>
              {classDetailDictionary.studentPerformanceDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topStudents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
                <Users className="mx-auto mb-3 h-12 w-12" />
                {classDetailDictionary.noStudentsInClass}
              </div>
            ) : (
              <div className="space-y-4">
                {topStudents.map((student) => {
                  const metric = metricByStudentId.get(student.studentId);
                  const progress = metric?.progress ?? 0;

                  return (
                    <div
                      key={student.studentId}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-sm font-semibold text-(--color-text-inverse)">
                        {getInitials(student.fullName, "S")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-app-text">
                          {student.fullName}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <Progress value={progress} className="h-2 flex-1" />
                          <span className="w-10 text-right text-sm text-app-text-muted">
                            {progress}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader>
            <CardTitle>{classDetailDictionary.upcomingEventsTitle}</CardTitle>
            <CardDescription>
              {classDetailDictionary.upcomingEventsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
                <Calendar className="mx-auto mb-3 h-12 w-12" />
                {classDetailDictionary.noUpcomingEvents}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => {
                  const daysUntil = getDaysUntil(event.date);

                  let relativeLabel = "";
                  if (daysUntil === 0) {
                    relativeLabel = classDetailDictionary.todayLabel;
                  } else if (daysUntil === 1) {
                    relativeLabel = classDetailDictionary.tomorrowLabel;
                  } else if (typeof daysUntil === "number" && daysUntil > 1) {
                    relativeLabel = classDetailDictionary.inDaysLabel.replace(
                      "{days}",
                      String(daysUntil),
                    );
                  }

                  return (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg border border-app-border bg-app-surface-2 p-3"
                    >
                      <div
                        className="mt-2 h-2 w-2 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-app-text">
                            {event.title}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-app-border bg-app-surface text-xs text-app-text-muted"
                          >
                            {event.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-app-text-muted">
                          {event.description}
                        </p>
                        <p className="mt-1 text-xs text-app-text-soft">
                          {new Date(event.date).toLocaleDateString(localeTag, {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          {classDetailDictionary.atLabel} {event.time}
                          {relativeLabel ? ` • ${relativeLabel}` : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-app-border bg-app-surface">
        <CardHeader>
          <CardTitle>{classDetailDictionary.recentAssignments}</CardTitle>
          <CardDescription>
            {classDetailDictionary.recentAssignmentsDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classAssignments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
              <FileText className="mx-auto mb-3 h-12 w-12" />
              {classDetailDictionary.noAssignmentsYet}
            </div>
          ) : (
            <div className="space-y-3">
              {classAssignments.slice(0, 5).map((assignment) => {
                const submittedCount = assignment.submissions.filter(
                  (submission) => submission.status !== "Not Submitted",
                ).length;
                const totalStudents = Math.max(enrolledStudents.length, 1);
                const submissionRate = Math.round(
                  (submittedCount / totalStudents) * 100,
                );
                const daysUntilDue = getDaysUntil(assignment.dueDate);

                let dueLabel = "";
                if (daysUntilDue === 0) {
                  dueLabel = classDetailDictionary.todayLabel;
                } else if (daysUntilDue === 1) {
                  dueLabel = classDetailDictionary.tomorrowLabel;
                } else if (typeof daysUntilDue === "number") {
                  dueLabel = classDetailDictionary.inDaysLabel.replace(
                    "{days}",
                    String(daysUntilDue),
                  );
                }

                return (
                  <article
                    key={assignment.id}
                    className="space-y-3 rounded-lg border border-app-border bg-app-surface-2 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-app-text">
                        {assignment.title}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-app-border bg-app-surface text-xs text-app-text-muted"
                      >
                        {assignment.status === "Published"
                          ? classDetailDictionary.assignmentStatusPublished
                          : classDetailDictionary.assignmentStatusDraft}
                      </Badge>
                    </div>
                    <p className="text-sm text-app-text-muted">
                      {assignment.description}
                    </p>
                    <p className="text-sm text-app-text-muted">
                      {classDetailDictionary.dueLabel}: {dueLabel || "-"} •{" "}
                      {assignment.totalPoints}{" "}
                      {classDetailDictionary.pointsLabel}
                    </p>
                    <div className="flex items-center justify-between text-sm text-app-text-muted">
                      <span>
                        {submittedCount}/{enrolledStudents.length}{" "}
                        {classDetailDictionary.submittedCountLabel}
                      </span>
                      <span>{submissionRate}%</span>
                    </div>
                    <Progress value={submissionRate} className="h-2" />
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
