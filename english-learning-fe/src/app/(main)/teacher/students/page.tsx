"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, workspacesApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import { useNotification } from "@/providers/notification-provider";
import { Card, CardContent } from "@/components/ui/card";
import { StudentFormDialog } from "@/components/teacher/students/student-form-dialog";
import { StudentsEmptyState } from "@/components/teacher/students/students-empty-state";
import { StudentsMobileList } from "@/components/teacher/students/students-mobile-list";
import { StudentsSearchStats } from "@/components/teacher/students/students-search-stats";
import { StudentsTable } from "@/components/teacher/students/students-table";
import {
  EMPTY_STUDENT_FORM,
  type StudentFormData,
  type StudentItem,
} from "@/components/teacher/students/types";

export default function StudentsPage() {
  const { dictionary } = useAppSettings();
  const { activeWorkspaceId } = useAuth();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const studentsDictionary = dictionary.studentsPage;

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<StudentFormData>(EMPTY_STUDENT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    if (!activeWorkspaceId) {
      setStudents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await workspacesApi.listStudents(activeWorkspaceId);
      setStudents(response.result);
    } catch (error) {
      setStudents([]);
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            studentsDictionary.loadStudentsError,
          ),
        );
      } else {
        notifyError(studentsDictionary.loadStudentsError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    activeWorkspaceId,
    dictionary,
    notifyError,
    studentsDictionary.loadStudentsError,
  ]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.userName.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, students],
  );

  const activeStudentsCount = useMemo(
    () =>
      students.filter((student) => student.status.toLowerCase() === "active")
        .length,
    [students],
  );

  const resetForm = () => {
    setEditingStudent(null);
    setFormData(EMPTY_STUDENT_FORM);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeWorkspaceId) {
      notifyError(dictionary.dashboard.workspaceNotFound);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStudent) {
        await workspacesApi.updateStudent(
          activeWorkspaceId,
          editingStudent.studentId,
          formData,
        );
        notifySuccess(studentsDictionary.studentUpdatedSuccess);
      } else {
        const response = await workspacesApi.createStudent(
          activeWorkspaceId,
          formData,
        );
        notifySuccess(
          studentsDictionary.studentCreatedSuccess,
          studentsDictionary.studentCreatedPassword.replace(
            "{password}",
            response.result.plainPassword,
          ),
        );
      }

      await loadStudents();
      handleDialogOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            studentsDictionary.defaultErrorMessage,
          ),
        );
      } else {
        notifyError(studentsDictionary.defaultErrorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (student: StudentItem) => {
    setEditingStudent(student);
    setFormData({
      fullName: student.fullName,
      userName: student.userName,
      email: student.email,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (studentId: string) => {
    if (!activeWorkspaceId) {
      notifyError(dictionary.dashboard.workspaceNotFound);
      return;
    }

    if (!window.confirm(studentsDictionary.deleteConfirm)) {
      return;
    }

    setDeletingId(studentId);
    try {
      await workspacesApi.removeStudent(activeWorkspaceId, studentId);
      notifySuccess(studentsDictionary.studentDeletedSuccess);
      await loadStudents();
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            studentsDictionary.defaultErrorMessage,
          ),
        );
      } else {
        notifyError(studentsDictionary.defaultErrorMessage);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {studentsDictionary.title}
          </h1>
          <p className="text-app-text-muted">
            {studentsDictionary.description}
          </p>
        </div>

        <StudentFormDialog
          open={dialogOpen}
          editingStudent={editingStudent}
          formData={formData}
          isSubmitting={isSubmitting}
          dictionary={studentsDictionary}
          onOpenChange={handleDialogOpenChange}
          onFormDataChange={setFormData}
          onSubmit={handleSubmit}
        />
      </div>

      <StudentsSearchStats
        searchQuery={searchQuery}
        totalStudents={students.length}
        activeStudents={activeStudentsCount}
        dictionary={studentsDictionary}
        onSearchQueryChange={setSearchQuery}
      />

      <Card className="border-app-border bg-app-surface">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-4 py-14 text-center">
              <p className="text-app-text-muted">
                {studentsDictionary.loadingStudents}
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <StudentsEmptyState
              searchQuery={searchQuery}
              dictionary={studentsDictionary}
              onAddFirstStudent={() => setDialogOpen(true)}
            />
          ) : (
            <>
              <StudentsMobileList
                students={filteredStudents}
                deletingId={deletingId}
                dictionary={studentsDictionary}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
              <StudentsTable
                students={filteredStudents}
                deletingId={deletingId}
                dictionary={studentsDictionary}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
