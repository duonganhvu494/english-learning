"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, assignmentsApi, submissionsApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import type { ClassStudentListItem } from "@/types/class";
import type { Dictionary } from "@/i18n/types";
import type { AssignmentQuizAttempt, SessionAssignment } from "@/types/assignment";
import type { AssignmentSubmission } from "@/types/submission";

export type SubmissionRowStatus =
  | "not_submitted"
  | "submitted"
  | "graded"
  | "in_progress";

export type SubmissionRow = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: SubmissionRowStatus;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  feedback: string | null;
};

type UseAssignmentDataArgs = {
  assignmentId: string;
  classId: string;
  enrolledStudents: ClassStudentListItem[];
  dictionary: Dictionary;
  classDetailDictionary: Dictionary["classDetailPage"];
  notifyError: (
    title: string,
    messageOrDuration?: string | number,
    duration?: number,
  ) => void;
};

type UseAssignmentDataResult = {
  assignment: SessionAssignment | null;
  rows: SubmissionRow[];
  isLoading: boolean;
  reload: () => Promise<void>;
};

function mapRows(params: {
  assignment: SessionAssignment | null;
  quizAttempts: AssignmentQuizAttempt[];
  manualSubmissions: AssignmentSubmission[];
  enrolledStudents: ClassStudentListItem[];
}): SubmissionRow[] {
  const { assignment, quizAttempts, manualSubmissions, enrolledStudents } = params;

  if (!assignment) {
    return [];
  }

  if (assignment.type === "quiz") {
    const attemptMap = new Map(
      quizAttempts.map((attempt) => [attempt.studentId, attempt]),
    );

    return enrolledStudents.map((student) => {
      const attempt = attemptMap.get(student.studentId);
      if (!attempt) {
        return {
          studentId: student.studentId,
          studentName: student.fullName,
          studentEmail: student.email,
          status: "not_submitted",
          submittedAt: null,
          score: null,
          maxScore: null,
          feedback: null,
        };
      }

      const status: SubmissionRowStatus =
        attempt.status === "submitted"
          ? "graded"
          : attempt.status === "in_progress"
            ? "in_progress"
            : "not_submitted";

      return {
        studentId: student.studentId,
        studentName: student.fullName,
        studentEmail: student.email,
        status,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        maxScore: attempt.maxScore,
        feedback: null,
      };
    });
  }

  const submissionMap = new Map(
    manualSubmissions.map((submission) => [submission.studentId, submission]),
  );

  return enrolledStudents.map((student) => {
    const submission = submissionMap.get(student.studentId);
    if (!submission || !submission.submitted) {
      return {
        studentId: student.studentId,
        studentName: student.fullName,
        studentEmail: student.email,
        status: "not_submitted",
        submittedAt: null,
        score: null,
        maxScore: null,
        feedback: null,
      };
    }

    return {
      studentId: student.studentId,
      studentName: student.fullName,
      studentEmail: student.email,
      status: submission.grade !== null ? "graded" : "submitted",
      submittedAt: submission.submittedAt,
      score: submission.grade,
      maxScore: 100,
      feedback: submission.feedback,
    };
  });
}

export function useAssignmentData({
  assignmentId,
  classId,
  enrolledStudents,
  dictionary,
  classDetailDictionary,
  notifyError,
}: UseAssignmentDataArgs): UseAssignmentDataResult {
  const [assignment, setAssignment] = useState<SessionAssignment | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<AssignmentQuizAttempt[]>([]);
  const [manualSubmissions, setManualSubmissions] = useState<
    AssignmentSubmission[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);

    try {
      const detailResponse = await assignmentsApi.getAssignmentDetail(assignmentId);
      const nextAssignment = detailResponse.result;
      if (nextAssignment.classId !== classId) {
        setAssignment(null);
        setQuizAttempts([]);
        setManualSubmissions([]);
      } else {
        setAssignment(nextAssignment);

        if (nextAssignment.type === "quiz") {
          const attemptsResponse =
            await assignmentsApi.listQuizAttempts(assignmentId);
          setQuizAttempts(attemptsResponse.result);
          setManualSubmissions([]);
        } else {
          const submissionsResponse =
            await submissionsApi.listAssignmentSubmissions(assignmentId);
          setManualSubmissions(submissionsResponse.result);
          setQuizAttempts([]);
        }
      }
    } catch (error) {
      setAssignment(null);
      setQuizAttempts([]);
      setManualSubmissions([]);
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.loadAssignmentsError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.loadAssignmentsError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    assignmentId,
    classDetailDictionary,
    classId,
    dictionary,
    notifyError,
  ]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const rows = useMemo(
    () => mapRows({ assignment, quizAttempts, manualSubmissions, enrolledStudents }),
    [assignment, enrolledStudents, manualSubmissions, quizAttempts],
  );

  return {
    assignment,
    rows,
    isLoading,
    reload,
  };
}

export function getRowStatusLabel(
  status: SubmissionRowStatus,
  classDetailDictionary: Dictionary["classDetailPage"],
) {
  if (status === "graded") {
    return classDetailDictionary.gradedLabel;
  }
  if (status === "submitted") {
    return classDetailDictionary.submittedLabel;
  }
  if (status === "in_progress") {
    return classDetailDictionary.inProgressLabel;
  }
  return classDetailDictionary.notSubmittedLabel;
}

export function getRowStatusVariant(
  status: SubmissionRowStatus,
): "outline" | "default" | "secondary" {
  if (status === "graded") {
    return "default";
  }
  if (status === "submitted" || status === "in_progress") {
    return "secondary";
  }
  return "outline";
}
