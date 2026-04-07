"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AssignmentDashboardView } from "@/components/teacher/assignments/assignment-dashboard-view";
import { useClassDetail } from "@/components/teacher/class-detail/class-detail-context";
import { getDaysUntil, getLocaleTag } from "@/components/teacher/class-detail/class-detail-utils";
import { useAssignmentData } from "@/components/teacher/assignments/use-assignment-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";

type PageProps = {
  params: Promise<{
    id: string;
    assignmentId: string;
  }>;
};

type GradeRangeData = {
  label: string;
  count: number;
};

type Performer = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: "not_submitted" | "submitted" | "graded" | "in_progress";
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
  percentage: number;
};

const STATUS_COLORS = {
  graded: "#10B981",
  pending: "#F59E0B",
  notSubmitted: "#EF4444",
} as const;

function getPercentage(score: number | null, maxScore: number | null) {
  if (score === null) {
    return null;
  }
  const denominator = maxScore && maxScore > 0 ? maxScore : 100;
  return (score / denominator) * 100;
}

function formatDueLabel(
  daysUntilDue: number | null,
  classDetailDictionary: ReturnType<typeof useAppSettings>["dictionary"]["classDetailPage"],
) {
  if (typeof daysUntilDue !== "number") {
    return classDetailDictionary.notAvailableLabel;
  }
  if (daysUntilDue < 0) {
    return classDetailDictionary.overdueLabel.replace("{days}", String(Math.abs(daysUntilDue)));
  }
  if (daysUntilDue === 0) {
    return classDetailDictionary.dueToday;
  }
  return `${classDetailDictionary.dueIn} ${daysUntilDue} ${
    daysUntilDue === 1 ? classDetailDictionary.day : classDetailDictionary.days
  }`;
}

export default function AssignmentDashboardPage({ params }: PageProps) {
  const { id: classId, assignmentId } = use(params);
  const router = useRouter();
  const { dictionary, locale } = useAppSettings();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);
  const { error: notifyError } = useNotification();
  const { classItem, enrolledStudents } = useClassDetail();

  const { assignment, rows, isLoading } = useAssignmentData({
    assignmentId,
    classId,
    enrolledStudents,
    dictionary,
    classDetailDictionary,
    notifyError,
  });

  const metrics = useMemo(() => {
    const totalStudents = rows.length;
    const submittedCount = rows.filter((row) => row.status !== "not_submitted").length;
    const gradedRows = rows.filter((row) => row.status === "graded" && row.score !== null);
    const gradedCount = gradedRows.length;
    const notSubmittedCount = rows.filter((row) => row.status === "not_submitted").length;
    const pendingCount = rows.filter(
      (row) => row.status === "submitted" || row.status === "in_progress",
    ).length;

    const gradedRowsWithPercentage: Performer[] = gradedRows
      .map((row) => ({
        ...row,
        percentage: getPercentage(row.score, row.maxScore) ?? 0,
      }))
      .sort((rowA, rowB) => rowB.percentage - rowA.percentage);

    const averageScore =
      gradedRowsWithPercentage.length > 0
        ? gradedRowsWithPercentage.reduce((sum, row) => sum + row.percentage, 0) /
          gradedRowsWithPercentage.length
        : null;

    const medianScore = (() => {
      const percentages = gradedRowsWithPercentage
        .map((row) => row.percentage)
        .sort((valueA, valueB) => valueA - valueB);

      if (percentages.length === 0) {
        return null;
      }

      const middleIndex = Math.floor(percentages.length / 2);
      if (percentages.length % 2 === 1) {
        return percentages[middleIndex];
      }
      return (percentages[middleIndex - 1] + percentages[middleIndex]) / 2;
    })();

    const gradeDistributionData: GradeRangeData[] = [
      { label: classDetailDictionary.gradeRangeA, count: 0 },
      { label: classDetailDictionary.gradeRangeB, count: 0 },
      { label: classDetailDictionary.gradeRangeC, count: 0 },
      { label: classDetailDictionary.gradeRangeD, count: 0 },
      { label: classDetailDictionary.gradeRangeF, count: 0 },
    ];

    gradedRowsWithPercentage.forEach((row) => {
      if (row.percentage >= 90) {
        gradeDistributionData[0].count += 1;
      } else if (row.percentage >= 80) {
        gradeDistributionData[1].count += 1;
      } else if (row.percentage >= 70) {
        gradeDistributionData[2].count += 1;
      } else if (row.percentage >= 60) {
        gradeDistributionData[3].count += 1;
      } else {
        gradeDistributionData[4].count += 1;
      }
    });

    const submissionStatusData = [
      {
        label: classDetailDictionary.gradedLabel,
        value: gradedCount,
        color: STATUS_COLORS.graded,
      },
      {
        label: classDetailDictionary.pendingLabel,
        value: pendingCount,
        color: STATUS_COLORS.pending,
      },
      {
        label: classDetailDictionary.notSubmittedLabel,
        value: notSubmittedCount,
        color: STATUS_COLORS.notSubmitted,
      },
    ];

    const submissionRate =
      totalStudents > 0 ? Math.round((submittedCount / totalStudents) * 100) : 0;

    return {
      totalStudents,
      submittedCount,
      gradedCount,
      notSubmittedCount,
      pendingCount,
      submissionRate,
      averageScore,
      highestPerformer:
        gradedRowsWithPercentage.length > 0 ? gradedRowsWithPercentage[0] : null,
      lowestPerformer:
        gradedRowsWithPercentage.length > 0
          ? gradedRowsWithPercentage[gradedRowsWithPercentage.length - 1]
          : null,
      medianScore,
      gradeDistributionData,
      maxGradeRangeCount: Math.max(1, ...gradeDistributionData.map((item) => item.count)),
      submissionStatusData,
      topPerformers: gradedRowsWithPercentage.slice(0, 5),
    };
  }, [
    classDetailDictionary.gradeRangeA,
    classDetailDictionary.gradeRangeB,
    classDetailDictionary.gradeRangeC,
    classDetailDictionary.gradeRangeD,
    classDetailDictionary.gradeRangeF,
    classDetailDictionary.gradedLabel,
    classDetailDictionary.notSubmittedLabel,
    classDetailDictionary.pendingLabel,
    rows,
  ]);

  if (!classItem) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-app-border bg-app-surface">
        <CardContent className="py-14 text-center text-app-text-muted">
          {classDetailDictionary.loadingAssignments}
        </CardContent>
      </Card>
    );
  }

  if (!assignment) {
    return (
      <Card className="border-app-border bg-app-surface">
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-xl font-semibold text-app-text">
            {classDetailDictionary.assignmentNotFound}
          </p>
          <div className="mx-auto w-full max-w-xs">
            <Link href={`/teacher/class/${classId}/assignments`}>
              <Button variant="outline" className="w-full">
                {classDetailDictionary.backToClasses}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysUntilDue = getDaysUntil(assignment.timeEnd);
  const dueLabel = formatDueLabel(daysUntilDue, classDetailDictionary);

  return (
    <AssignmentDashboardView
      classId={classId}
      assignmentId={assignmentId}
      assignment={assignment}
      className={classItem.className}
      localeTag={localeTag}
      classDetailDictionary={classDetailDictionary}
      totalStudents={metrics.totalStudents}
      gradedCount={metrics.gradedCount}
      notSubmittedCount={metrics.notSubmittedCount}
      pendingCount={metrics.pendingCount}
      submissionRate={metrics.submissionRate}
      averageScore={metrics.averageScore}
      highestPerformer={metrics.highestPerformer}
      lowestPerformer={metrics.lowestPerformer}
      medianScore={metrics.medianScore}
      gradeDistributionData={metrics.gradeDistributionData}
      maxGradeRangeCount={metrics.maxGradeRangeCount}
      submissionStatusData={metrics.submissionStatusData}
      topPerformers={metrics.topPerformers}
      dueLabel={dueLabel}
      onBack={() => router.back()}
    />
  );
}
