import type { ClassStudentListItem } from "@/types/class";
import type { Assignment } from "@/types/types";

export type ClassStudentMetric = {
  progress: number;
  completedProjects: number;
  submittedAssignments: number;
  gradedAssignments: number;
};

export function getLocaleTag(locale: string) {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function getDaysUntil(dateValue: string, currentTimestamp = Date.now()) {
  const targetDate = new Date(dateValue);
  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const startOfToday = new Date(currentTimestamp);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTargetDate = new Date(targetDate);
  startOfTargetDate.setHours(0, 0, 0, 0);

  return Math.ceil(
    (startOfTargetDate.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24),
  );
}

export function buildClassStudentMetric(
  studentId: string,
  assignments: Assignment[],
): ClassStudentMetric {
  const totalAssignments = assignments.length;
  if (totalAssignments === 0) {
    return {
      progress: 0,
      completedProjects: 0,
      submittedAssignments: 0,
      gradedAssignments: 0,
    };
  }

  const submittedAssignments = assignments.filter((assignment) =>
    assignment.submissions.some(
      (submission) =>
        submission.studentId === studentId &&
        submission.status !== "Not Submitted",
    ),
  ).length;

  const gradedAssignments = assignments.filter((assignment) =>
    assignment.submissions.some(
      (submission) =>
        submission.studentId === studentId && submission.status === "Graded",
    ),
  ).length;

  return {
    progress: Math.round((submittedAssignments / totalAssignments) * 100),
    completedProjects: gradedAssignments,
    submittedAssignments,
    gradedAssignments,
  };
}

export function sortStudentsByProgress(
  students: ClassStudentListItem[],
  getMetric: (studentId: string) => ClassStudentMetric,
) {
  return [...students].sort((studentA, studentB) => {
    const metricA = getMetric(studentA.studentId);
    const metricB = getMetric(studentB.studentId);

    if (metricA.progress !== metricB.progress) {
      return metricB.progress - metricA.progress;
    }

    return studentA.fullName.localeCompare(studentB.fullName);
  });
}
