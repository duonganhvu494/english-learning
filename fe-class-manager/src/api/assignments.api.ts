import type { AssignmentResponse, CreateAssignmentDto } from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

export const assignmentsApi = {
  async createAssignment(
    sessionId: string,
    payload: CreateAssignmentDto,
  ): Promise<AssignmentResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<AssignmentResponse>(
      http.post(`/sessions/${sessionId}/assignments`, payload),
    );
  },

  async listSessionAssignments(sessionId: string): Promise<AssignmentResponse[]> {
    return unwrap<AssignmentResponse[]>(
      http.get(`/sessions/${sessionId}/assignments`),
    );
  },

  async getAssignment(assignmentId: string): Promise<AssignmentResponse> {
    return unwrap<AssignmentResponse>(http.get(`/assignments/${assignmentId}`));
  },
};
