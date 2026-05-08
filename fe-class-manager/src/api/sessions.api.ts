import type { CreateSessionDto, SessionResponse } from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

export const sessionsApi = {
  async createSession(
    classId: string,
    payload: CreateSessionDto,
  ): Promise<SessionResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<SessionResponse>(http.post(`/classes/${classId}/sessions`, payload));
  },

  async listClassSessions(classId: string): Promise<SessionResponse[]> {
    return unwrap<SessionResponse[]>(http.get(`/classes/${classId}/sessions`));
  },

  async getSession(sessionId: string): Promise<SessionResponse> {
    return unwrap<SessionResponse>(http.get(`/sessions/${sessionId}`));
  },
};
