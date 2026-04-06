"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Dictionary } from "@/i18n/types";
import type { SessionAssignment } from "@/types/assignment";
import type { SubmissionRow } from "@/components/teacher/assignments/use-assignment-data";

type Performer = SubmissionRow & { percentage: number };

type AssignmentDashboardViewProps = {
  classId: string;
  assignmentId: string;
  assignment: SessionAssignment;
  className: string;
  localeTag: string;
  classDetailDictionary: Dictionary["classDetailPage"];
  totalStudents: number;
  gradedCount: number;
  notSubmittedCount: number;
  pendingCount: number;
  submissionRate: number;
  averageScore: number | null;
  highestPerformer: Performer | null;
  lowestPerformer: Performer | null;
  medianScore: number | null;
  gradeDistributionData: Array<{ label: string; count: number }>;
  maxGradeRangeCount: number;
  submissionStatusData: Array<{ label: string; value: number; color: string }>;
  topPerformers: Performer[];
  dueLabel: string;
  onBack: () => void;
};

function formatScore(row: SubmissionRow | null) {
  if (!row || row.score === null) {
    return null;
  }
  if (row.maxScore && row.maxScore > 0) {
    return `${row.score}/${row.maxScore}`;
  }
  return String(row.score);
}

function getStatusLabel(
  status: SessionAssignment["status"],
  classDetailDictionary: Dictionary["classDetailPage"],
) {
  if (status === "open") {
    return classDetailDictionary.assignmentStatusOpen;
  }
  if (status === "upcoming") {
    return classDetailDictionary.assignmentStatusUpcoming;
  }
  return classDetailDictionary.assignmentStatusClosed;
}

export function AssignmentDashboardView({
  classId,
  assignmentId,
  assignment,
  className,
  localeTag,
  classDetailDictionary,
  totalStudents,
  gradedCount,
  notSubmittedCount,
  pendingCount,
  submissionRate,
  averageScore,
  highestPerformer,
  lowestPerformer,
  medianScore,
  gradeDistributionData,
  maxGradeRangeCount,
  submissionStatusData,
  topPerformers,
  dueLabel,
  onBack,
}: AssignmentDashboardViewProps) {
  const highestScoreText = formatScore(highestPerformer);
  const lowestScoreText = formatScore(lowestPerformer);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" className="w-auto" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {classDetailDictionary.assignmentsTitle}
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {classDetailDictionary.assignmentDashboardTitle}
          </h1>
          <p className="text-app-text-muted">{assignment.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {assignment.type === "quiz"
                ? classDetailDictionary.assignmentTypeQuiz
                : classDetailDictionary.assignmentTypeManual}
            </Badge>
            <Badge variant="outline">
              {getStatusLabel(assignment.status, classDetailDictionary)}
            </Badge>
            <span className="text-sm text-app-text-muted">{className}</span>
          </div>
        </div>
        <Link href={`/teacher/class/${classId}/assignments/${assignmentId}`}>
          <Button>
            <BarChart3 className="mr-2 h-4 w-4" />
            {classDetailDictionary.assignmentDashboardViewAssignment}
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-app-text-muted">
                {classDetailDictionary.totalStudents}
              </CardTitle>
              <Users className="h-4 w-4 text-app-text-soft" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-app-text">{totalStudents}</div>
            <p className="mt-1 text-xs text-app-text-muted">
              {classDetailDictionary.assignmentDashboardEnrolledInClass}
            </p>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-app-text-muted">
                {classDetailDictionary.assignmentDashboardSubmissionRate}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-app-text-soft" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-app-text">{submissionRate}%</div>
            <Progress value={submissionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-app-text-muted">
                {classDetailDictionary.assignmentDashboardAverageScore}
              </CardTitle>
              <Award className="h-4 w-4 text-app-text-soft" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-app-text">
              {averageScore !== null
                ? `${averageScore.toFixed(1)}%`
                : classDetailDictionary.notAvailableLabel}
            </div>
            <p className="mt-1 text-xs text-app-text-muted">
              {gradedCount} {classDetailDictionary.gradedLabel.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-app-text-muted">
                {classDetailDictionary.assignmentDashboardTimeRemaining}
              </CardTitle>
              <Calendar className="h-4 w-4 text-app-text-soft" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-app-text">{dueLabel}</div>
            <p className="mt-1 text-xs text-app-text-muted">
              {new Date(assignment.timeEnd).toLocaleDateString(localeTag)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-app-border bg-app-surface">
          <CardHeader>
            <CardTitle>{classDetailDictionary.assignmentDashboardGradeDistributionTitle}</CardTitle>
            <CardDescription>
              {classDetailDictionary.assignmentDashboardGradeDistributionDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-4">
                {gradeDistributionData.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-app-text-muted">
                      <span>{item.label}</span>
                      <span>{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-app-surface-2">
                      <div
                        className="h-2 rounded-full bg-(--color-primary)"
                        style={{
                          width: `${(item.count / maxGradeRangeCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-app-text-muted">
                <div className="text-center">
                  <BarChart3 className="mx-auto mb-3 h-12 w-12 text-app-text-soft" />
                  <p>{classDetailDictionary.assignmentDashboardNoGradedSubmissions}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader>
            <CardTitle>{classDetailDictionary.assignmentDashboardSubmissionStatusTitle}</CardTitle>
            <CardDescription>
              {classDetailDictionary.assignmentDashboardSubmissionStatusDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-app-surface-2">
              {submissionStatusData.map((item) => {
                const widthPercent =
                  totalStudents > 0 ? (item.value / totalStudents) * 100 : 0;
                return (
                  <div
                    key={item.label}
                    style={{ width: `${widthPercent}%`, backgroundColor: item.color }}
                  />
                );
              })}
            </div>
            <div className="space-y-3">
              {submissionStatusData.map((item) => {
                const percent =
                  totalStudents > 0 ? (item.value / totalStudents) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-app-text">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label}</span>
                      </div>
                      <span className="text-app-text-muted">
                        {item.value} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={percent} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-app-border bg-app-surface">
          <CardHeader>
            <CardTitle>{classDetailDictionary.assignmentDashboardScoreStatisticsTitle}</CardTitle>
            <CardDescription>
              {classDetailDictionary.assignmentDashboardScoreStatisticsDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-app-border p-4">
              <div>
                <p className="text-sm text-app-text-muted">
                  {classDetailDictionary.assignmentDashboardHighestScore}
                </p>
                <p className="text-2xl font-semibold text-app-text">
                  {highestScoreText || classDetailDictionary.notAvailableLabel}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#E9FBF4" }}>
                <TrendingUp className="h-6 w-6" style={{ color: "#10B981" }} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-app-border p-4">
              <div>
                <p className="text-sm text-app-text-muted">
                  {classDetailDictionary.assignmentDashboardLowestScore}
                </p>
                <p className="text-2xl font-semibold text-app-text">
                  {lowestScoreText || classDetailDictionary.notAvailableLabel}
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: "#FFF6E8" }}>
                <Award className="h-6 w-6" style={{ color: "#F59E0B" }} />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-app-border p-4">
              <div>
                <p className="text-sm text-app-text-muted">
                  {classDetailDictionary.assignmentDashboardMedianScore}
                </p>
                <p className="text-2xl font-semibold text-app-text">
                  {medianScore !== null
                    ? `${medianScore.toFixed(1)}%`
                    : classDetailDictionary.notAvailableLabel}
                </p>
              </div>
              <div className="rounded-lg p-3 bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]">
                <BarChart3 className="h-6 w-6 text-(--color-primary)" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader>
            <CardTitle>{classDetailDictionary.assignmentDashboardTopPerformersTitle}</CardTitle>
            <CardDescription>
              {classDetailDictionary.assignmentDashboardTopPerformersDescription}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topPerformers.length > 0 ? (
              <div className="space-y-3">
                {topPerformers.map((performer, index) => (
                  <div
                    key={performer.studentId}
                    className="flex items-center gap-3 rounded-lg border border-app-border p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--color-primary) text-sm font-semibold text-(--color-text-inverse)">
                      #{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-app-text">{performer.studentName}</p>
                      <p className="truncate text-sm text-app-text-muted">{performer.studentEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-app-text">
                        {formatScore(performer) || classDetailDictionary.notAvailableLabel}
                      </p>
                      <p className="text-xs text-app-text-muted">{performer.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-app-text-muted">
                <Award className="mx-auto mb-3 h-12 w-12 text-app-text-soft" />
                <p>{classDetailDictionary.assignmentDashboardNoGradedSubmissions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-app-border bg-app-surface">
        <CardHeader>
          <CardTitle>{classDetailDictionary.assignmentDashboardSubmissionOverviewTitle}</CardTitle>
          <CardDescription>
            {classDetailDictionary.assignmentDashboardSubmissionOverviewDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{classDetailDictionary.assignmentDashboardStatusColumn}</TableHead>
                <TableHead>{classDetailDictionary.assignmentDashboardCountColumn}</TableHead>
                <TableHead>
                  {classDetailDictionary.assignmentDashboardPercentageColumn}
                </TableHead>
                <TableHead>{classDetailDictionary.assignmentDashboardProgressColumn}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" style={{ color: "#10B981" }} />
                    <span>{classDetailDictionary.gradedLabel}</span>
                  </div>
                </TableCell>
                <TableCell>{gradedCount}</TableCell>
                <TableCell>{totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0}%</TableCell>
                <TableCell>
                  <Progress
                    value={totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0}
                    className="w-32"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: "#F59E0B" }} />
                    <span>{classDetailDictionary.pendingLabel}</span>
                  </div>
                </TableCell>
                <TableCell>{pendingCount}</TableCell>
                <TableCell>{totalStudents > 0 ? Math.round((pendingCount / totalStudents) * 100) : 0}%</TableCell>
                <TableCell>
                  <Progress
                    value={totalStudents > 0 ? (pendingCount / totalStudents) * 100 : 0}
                    className="w-32"
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" style={{ color: "#EF4444" }} />
                    <span>{classDetailDictionary.notSubmittedLabel}</span>
                  </div>
                </TableCell>
                <TableCell>{notSubmittedCount}</TableCell>
                <TableCell>{totalStudents > 0 ? Math.round((notSubmittedCount / totalStudents) * 100) : 0}%</TableCell>
                <TableCell>
                  <Progress
                    value={totalStudents > 0 ? (notSubmittedCount / totalStudents) * 100 : 0}
                    className="w-32"
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-app-border bg-app-surface">
        <CardContent className="space-y-2 p-4 text-sm text-app-text-muted sm:flex sm:items-center sm:justify-between sm:space-y-0">
          <span>
            {classDetailDictionary.assignmentDashboardDueDatePrefix}:{" "}
            {new Date(assignment.timeEnd).toLocaleString(localeTag, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>{dueLabel}</span>
        </CardContent>
      </Card>
    </div>
  );
}
