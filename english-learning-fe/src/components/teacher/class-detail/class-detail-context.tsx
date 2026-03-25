"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, classesApi, workspacesApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import type { ClassStudentListItem, WorkspaceClass } from "@/types/class";
import type { WorkspaceStudentListItem } from "@/types/workspace";

type ClassDetailContextValue = {
  classId: string;
  classItem: WorkspaceClass | null;
  enrolledStudents: ClassStudentListItem[];
  workspaceStudents: WorkspaceStudentListItem[];
  availableStudents: WorkspaceStudentListItem[];
  isLoading: boolean;
  reloadClassData: () => Promise<void>;
  enrollStudent: (studentId: string) => Promise<boolean>;
  unenrollStudent: (studentId: string) => Promise<boolean>;
};

const ClassDetailContext = createContext<ClassDetailContextValue | null>(null);

type ClassDetailProviderProps = {
  classId: string;
  children: ReactNode;
};

export function ClassDetailProvider({
  classId,
  children,
}: ClassDetailProviderProps) {
  const { dictionary } = useAppSettings();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const classDetailDictionary = dictionary.classDetailPage;

  const [classItem, setClassItem] = useState<WorkspaceClass | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<ClassStudentListItem[]>(
    [],
  );
  const [workspaceStudents, setWorkspaceStudents] = useState<
    WorkspaceStudentListItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadClassData = useCallback(async () => {
    if (!classId) {
      setClassItem(null);
      setEnrolledStudents([]);
      setWorkspaceStudents([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const [classResponse, rosterResponse] = await Promise.all([
        classesApi.getClassDetail(classId),
        classesApi.getClassStudents(classId),
      ]);

      setClassItem(classResponse.result);
      setEnrolledStudents(rosterResponse.result.students);

      try {
        const workspaceStudentsResponse = await workspacesApi.listStudents(
          classResponse.result.workspaceId,
        );
        setWorkspaceStudents(workspaceStudentsResponse.result);
      } catch (error) {
        setWorkspaceStudents([]);
        if (error instanceof ApiError) {
          notifyError(
            translateApiMessage(
              error.details,
              error.code,
              dictionary,
              classDetailDictionary.loadStudentsError,
            ),
          );
        } else {
          notifyError(classDetailDictionary.loadStudentsError);
        }
      }
    } catch (error) {
      setClassItem(null);
      setEnrolledStudents([]);
      setWorkspaceStudents([]);

      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.loadClassError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.loadClassError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    classDetailDictionary.loadClassError,
    classDetailDictionary.loadStudentsError,
    classId,
    dictionary,
    notifyError,
  ]);

  useEffect(() => {
    void reloadClassData();
  }, [reloadClassData]);

  const enrollStudent = useCallback(
    async (studentId: string) => {
      if (!classId || !studentId) {
        return false;
      }

      try {
        await classesApi.addStudents(classId, {
          studentIds: [studentId],
        });
        notifySuccess(classDetailDictionary.enrollSuccess);
        await reloadClassData();
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          notifyError(
            translateApiMessage(
              error.details,
              error.code,
              dictionary,
              classDetailDictionary.enrollError,
            ),
          );
        } else {
          notifyError(classDetailDictionary.enrollError);
        }

        return false;
      }
    },
    [
      classDetailDictionary.enrollError,
      classDetailDictionary.enrollSuccess,
      classId,
      dictionary,
      notifyError,
      notifySuccess,
      reloadClassData,
    ],
  );

  const unenrollStudent = useCallback(
    async (studentId: string) => {
      if (!classId || !studentId) {
        return false;
      }

      try {
        await classesApi.removeStudent(classId, studentId);
        notifySuccess(classDetailDictionary.unenrollSuccess);
        await reloadClassData();
        return true;
      } catch (error) {
        if (error instanceof ApiError) {
          notifyError(
            translateApiMessage(
              error.details,
              error.code,
              dictionary,
              classDetailDictionary.unenrollError,
            ),
          );
        } else {
          notifyError(classDetailDictionary.unenrollError);
        }

        return false;
      }
    },
    [
      classDetailDictionary.unenrollError,
      classDetailDictionary.unenrollSuccess,
      classId,
      dictionary,
      notifyError,
      notifySuccess,
      reloadClassData,
    ],
  );

  const availableStudents = useMemo(() => {
    const enrolledStudentIds = new Set(
      enrolledStudents.map((student) => student.studentId),
    );

    return workspaceStudents.filter(
      (student) => !enrolledStudentIds.has(student.studentId),
    );
  }, [enrolledStudents, workspaceStudents]);

  const value = useMemo<ClassDetailContextValue>(
    () => ({
      classId,
      classItem,
      enrolledStudents,
      workspaceStudents,
      availableStudents,
      isLoading,
      reloadClassData,
      enrollStudent,
      unenrollStudent,
    }),
    [
      availableStudents,
      classId,
      classItem,
      enrollStudent,
      enrolledStudents,
      isLoading,
      reloadClassData,
      unenrollStudent,
      workspaceStudents,
    ],
  );

  return (
    <ClassDetailContext.Provider value={value}>
      {children}
    </ClassDetailContext.Provider>
  );
}

export function useClassDetail() {
  const context = useContext(ClassDetailContext);

  if (!context) {
    throw new Error("useClassDetail must be used inside ClassDetailProvider.");
  }

  return context;
}
