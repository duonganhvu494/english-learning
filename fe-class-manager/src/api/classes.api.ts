import type {
  AddClassStudentsDto,
  ClassResponse,
  ClassRosterResponse,
  ClassStudentRoleResponse,
  ClassStudentsResponse,
  CreateClassDto,
  UpdateClassStudentRoleDto,
} from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

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

  async listWorkspaceClasses(workspaceId: string): Promise<ClassResponse[]> {
    return unwrap<ClassResponse[]>(
      http.get(`/workspaces/${workspaceId}/classes`),
    );
  },

  async getClassStudents(classId: string): Promise<ClassRosterResponse> {
    return unwrap<ClassRosterResponse>(http.get(`/classes/${classId}/students`));
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

  async updateClassStudentRole(
    classId: string,
    studentId: string,
    payload: UpdateClassStudentRoleDto,
  ): Promise<ClassStudentRoleResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<ClassStudentRoleResponse>(
      http.patch(`/classes/${classId}/students/${studentId}/role`, payload),
    );
  },
};
