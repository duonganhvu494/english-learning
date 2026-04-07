import { httpClient } from "@/api/core/http-client";
import type {
  AddClassStudentsRequest,
  ClassRosterResponse,
  ClassStudentsResponse,
  CreateClassStudentRequest,
  CreateClassStudentResponse,
  CreateClassRequest,
  DeleteClassResponse,
  UpdateClassRequest,
  WorkspaceClass,
} from "@/types/class";

export const classesApi = {
  createClass: (workspaceId: string, payload: CreateClassRequest) =>
    httpClient.post<WorkspaceClass>(
      `/workspaces/${workspaceId}/classes`,
      payload,
    ),
  listClasses: (workspaceId: string) =>
    httpClient.get<WorkspaceClass[]>(`/workspaces/${workspaceId}/classes`),
  getClassDetail: (classId: string) =>
    httpClient.get<WorkspaceClass>(`/classes/${classId}`),
  getClassStudents: (classId: string) =>
    httpClient.get<ClassRosterResponse>(`/classes/${classId}/students`),
  addStudents: (classId: string, payload: AddClassStudentsRequest) =>
    httpClient.post<ClassStudentsResponse>(`/classes/${classId}/students`, payload),
  createStudentForClass: (
    classId: string,
    payload: CreateClassStudentRequest,
  ) =>
    httpClient.post<CreateClassStudentResponse>(
      `/classes/${classId}/students/create`,
      payload,
    ),
  removeStudent: (classId: string, studentId: string) =>
    httpClient.remove<ClassStudentsResponse>(
      `/classes/${classId}/students/${studentId}`,
    ),
  updateClass: (classId: string, payload: UpdateClassRequest) =>
    httpClient.patch<WorkspaceClass>(`/classes/${classId}`, payload),
  deleteClass: (classId: string) =>
    httpClient.remove<DeleteClassResponse>(`/classes/${classId}`),
};
