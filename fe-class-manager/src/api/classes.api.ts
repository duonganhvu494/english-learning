import type {
  AddClassStudentsDto,
  ClassDeleteResponse,
  ClassResponse,
  ClassRosterResponse,
  ClassStudentRoleResponse,
  ClassStudentsResponse,
  CreateClassDto,
  CreateClassStudentResponse,
  CreateStudentDto,
  UpdateClassDto,
  UpdateClassStudentRoleDto,
} from "@/types";

import { authApi } from "./auth.api";
import { http, unwrap } from "./http";

export const classesApi = {
  async createClass(
    workspaceId: string,
    payload: CreateClassDto,
  ): Promise<ClassResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<ClassResponse>(
      http.post(`/workspaces/${workspaceId}/classes`, payload),
    );
  },

  async listWorkspaceClasses(
    workspaceId: string,
  ): Promise<ClassResponse[]> {
    return unwrap<ClassResponse[]>(
      http.get(`/workspaces/${workspaceId}/classes`),
    );
  },

  async getClassDetail(
    classId: string,
  ): Promise<ClassResponse> {
    return unwrap<ClassResponse>(
      http.get(`/classes/${classId}`),
    );
  },

  async getClassStudents(
    classId: string,
  ): Promise<ClassRosterResponse> {
    return unwrap<ClassRosterResponse>(
      http.get(`/classes/${classId}/students`),
    );
  },

  async listMyClasses(): Promise<ClassResponse[]> {
    return unwrap<ClassResponse[]>(
      http.get("/me/classes"),
    );
  },

  async addClassStudents(
    classId: string,
    payload: AddClassStudentsDto,
  ): Promise<ClassStudentsResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<ClassStudentsResponse>(
      http.post(`/classes/${classId}/students`, payload),
    );
  },

  async createStudentForClass(
    classId: string,
    payload: CreateStudentDto,
  ): Promise<CreateClassStudentResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<CreateClassStudentResponse>(
      http.post(`/classes/${classId}/students/create`, payload),
    );
  },

  async updateClass(
    classId: string,
    payload: UpdateClassDto,
  ): Promise<ClassResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<ClassResponse>(
      http.patch(`/classes/${classId}`, payload),
    );
  },

  async removeStudentFromClass(
    classId: string,
    studentId: string,
  ): Promise<ClassStudentsResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<ClassStudentsResponse>(
      http.delete(`/classes/${classId}/students/${studentId}`),
    );
  },

  async deleteClass(
    classId: string,
  ): Promise<ClassDeleteResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<ClassDeleteResponse>(
      http.delete(`/classes/${classId}`),
    );
  },

  async updateClassStudentRole(
    classId: string,
    studentId: string,
    payload: UpdateClassStudentRoleDto,
  ): Promise<ClassStudentRoleResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<ClassStudentRoleResponse>(
      http.patch(
        `/classes/${classId}/students/${studentId}/role`,
        payload,
      ),
    );
  },
};