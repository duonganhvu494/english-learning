"use client";

import { use, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, assignmentsApi, submissionsApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { AssignmentDetailView } from "@/components/teacher/assignments/assignment-detail-view";
import { useClassDetail } from "@/components/teacher/class-detail/class-detail-context";
import { getLocaleTag } from "@/components/teacher/class-detail/class-detail-utils";
import {
  useAssignmentData,
  type SubmissionRow,
} from "@/components/teacher/assignments/use-assignment-data";
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

type GradeFormData = {
  studentId: string;
  studentName: string;
  grade: string;
  feedback: string;
};

const EMPTY_GRADE_FORM: GradeFormData = {
  studentId: "",
  studentName: "",
  grade: "",
  feedback: "",
};

export default function AssignmentDetailPage({ params }: PageProps) {
  const { id: classId, assignmentId } = use(params);
  const router = useRouter();
  const { dictionary, locale } = useAppSettings();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { classItem, enrolledStudents } = useClassDetail();

  const { assignment, rows, isLoading, reload } = useAssignmentData({
    assignmentId,
    classId,
    enrolledStudents,
    dictionary,
    classDetailDictionary,
    notifyError,
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [gradeForm, setGradeForm] = useState<GradeFormData>(EMPTY_GRADE_FORM);

  const openGradeDialog = (row: SubmissionRow) => {
    setGradeForm({
      studentId: row.studentId,
      studentName: row.studentName,
      grade: row.score !== null ? String(row.score) : "",
      feedback: row.feedback || "",
    });
    setGradeDialogOpen(true);
  };

  const handleSaveGrade = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!assignment || assignment.type === "quiz" || !gradeForm.studentId) {
      return;
    }

    const payload: { grade?: number; feedback?: string } = {};
    if (gradeForm.grade.trim() !== "") {
      payload.grade = Number(gradeForm.grade);
    }
    if (gradeForm.feedback.trim() !== "") {
      payload.feedback = gradeForm.feedback.trim();
    }

    setIsSavingGrade(true);
    try {
      await submissionsApi.reviewSubmission(assignment.id, gradeForm.studentId, payload);
      notifySuccess(classDetailDictionary.assignmentUpdatedSuccess);
      setGradeDialogOpen(false);
      await reload();
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.assignmentCreateError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.assignmentCreateError);
      }
    } finally {
      setIsSavingGrade(false);
    }
  };

  const handleDelete = async () => {
    if (!assignment) {
      return;
    }
    if (!window.confirm(classDetailDictionary.assignmentDeleteConfirm)) {
      return;
    }

    setIsDeleting(true);
    try {
      await assignmentsApi.deleteAssignment(assignment.id);
      notifySuccess(classDetailDictionary.assignmentDeletedSuccess);
      router.replace(`/teacher/class/${classId}/assignments`);
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.assignmentDeleteError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.assignmentDeleteError);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const stats = useMemo(() => {
    const totalStudents = rows.length;
    const submittedCount = rows.filter((row) => row.status !== "not_submitted").length;
    const gradedCount = rows.filter((row) => row.status === "graded").length;
    const averageScore = rows
      .filter((row) => row.score !== null && row.maxScore !== null && row.maxScore > 0)
      .reduce(
        (sum, row, _, arr) =>
          sum + (((row.score || 0) / (row.maxScore || 100)) * 100) / arr.length,
        0,
      );

    return {
      totalStudents,
      submittedCount,
      gradedCount,
      averageScore,
    };
  }, [rows]);

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

  return (
    <AssignmentDetailView
      classId={classId}
      assignmentId={assignmentId}
      assignment={assignment}
      className={classItem.className}
      localeTag={localeTag}
      dictionary={dictionary}
      classDetailDictionary={classDetailDictionary}
      rows={rows}
      totalStudents={stats.totalStudents}
      submittedCount={stats.submittedCount}
      gradedCount={stats.gradedCount}
      averageScore={stats.averageScore}
      isDeleting={isDeleting}
      onBack={() => router.back()}
      onDelete={handleDelete}
      onOpenGrade={openGradeDialog}
      gradeDialogOpen={gradeDialogOpen}
      onGradeDialogOpenChange={setGradeDialogOpen}
      gradeForm={gradeForm}
      onGradeChange={(patch) =>
        setGradeForm((prev) => ({
          ...prev,
          ...patch,
        }))
      }
      isSavingGrade={isSavingGrade}
      onSaveGrade={handleSaveGrade}
    />
  );
}
