import { httpClient } from "@/api/core/http-client";
import type {
  ClassSession,
  CreateSessionRequest,
  DeleteSessionResponse,
  UpdateSessionRequest,
} from "@/types/session";

export const sessionsApi = {
  createSession: (classId: string, payload: CreateSessionRequest) =>
    httpClient.post<ClassSession>(`/classes/${classId}/sessions`, payload),
  listClassSessions: (classId: string) =>
    httpClient.get<ClassSession[]>(`/classes/${classId}/sessions`),
  getSessionDetail: (sessionId: string) =>
    httpClient.get<ClassSession>(`/sessions/${sessionId}`),
  updateSession: (sessionId: string, payload: UpdateSessionRequest) =>
    httpClient.patch<ClassSession>(`/sessions/${sessionId}`, payload),
  deleteSession: (sessionId: string) =>
    httpClient.remove<DeleteSessionResponse>(`/sessions/${sessionId}`),
};
