import { httpClient } from "@/api/core/http-client";
import type {
  CreateSessionAssignmentRequest,
  DeleteAssignmentResponse,
  SessionAssignment,
} from "@/types/assignment";

export const assignmentsApi = {
  createAssignment: (sessionId: string, payload: CreateSessionAssignmentRequest) =>
    httpClient.post<SessionAssignment>(`/sessions/${sessionId}/assignments`, payload),
  listSessionAssignments: (sessionId: string) =>
    httpClient.get<SessionAssignment[]>(`/sessions/${sessionId}/assignments`),
  getAssignmentDetail: (assignmentId: string) =>
    httpClient.get<SessionAssignment>(`/assignments/${assignmentId}`),
  deleteAssignment: (assignmentId: string) =>
    httpClient.remove<DeleteAssignmentResponse>(`/assignments/${assignmentId}`),
};
