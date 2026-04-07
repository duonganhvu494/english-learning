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
import type {
  ClassStudentListItem,
  CreateClassStudentRequest,
  WorkspaceClass,
} from "@/types/class";
import type { WorkspaceStudentListItem } from "@/types/workspace";

type ClassDetailContextValue = {
  classId: string;
  classItem: WorkspaceClass | null;
  enrolledStudents: ClassStudentListItem[];
  workspaceStudents: WorkspaceStudentListItem[];
  availableStudents: WorkspaceStudentListItem[];
  isLoading: boolean;
  reloadClassData: () => Promise<void>;
  enrollStudents: (studentIds: string[]) => Promise<boolean>;
  createStudentForClass: (
    payload: CreateClassStudentRequest,
  ) => Promise<boolean>;
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
  const studentsDictionary = dictionary.studentsPage;

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

  const enrollStudents = useCallback(
    async (studentIds: string[]) => {
      if (!classId || studentIds.length === 0) {
        return false;
      }

      try {
        await classesApi.addStudents(classId, {
          studentIds,
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

  const createStudentForClass = useCallback(
    async (payload: CreateClassStudentRequest) => {
      if (!classId) {
        return false;
      }

      try {
        const response = await classesApi.createStudentForClass(classId, payload);
        notifySuccess(
          studentsDictionary.studentCreatedSuccess,
          studentsDictionary.studentCreatedPassword.replace(
            "{password}",
            response.result.plainPassword,
          ),
        );
        await reloadClassData();
        return true;
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

        return false;
      }
    },
    [
      classId,
      dictionary,
      notifyError,
      notifySuccess,
      reloadClassData,
      studentsDictionary.defaultErrorMessage,
      studentsDictionary.studentCreatedPassword,
      studentsDictionary.studentCreatedSuccess,
    ],
  );

  const value = useMemo<ClassDetailContextValue>(
    () => ({
      classId,
      classItem,
      enrolledStudents,
      workspaceStudents,
      availableStudents,
      isLoading,
      reloadClassData,
      enrollStudents,
      createStudentForClass,
      unenrollStudent,
    }),
    [
      availableStudents,
      classId,
      classItem,
      createStudentForClass,
      enrollStudents,
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
