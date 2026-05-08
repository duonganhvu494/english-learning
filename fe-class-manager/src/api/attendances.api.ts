import type {
  AttendanceSelfResponse,
  AttendanceUpdateDto,
  AttendanceUpdateResponse,
  SessionAttendanceResponse,
} from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

export const attendancesApi = {
  async getSessionAttendances(sessionId: string): Promise<SessionAttendanceResponse> {
    return unwrap<SessionAttendanceResponse>(
      http.get(`/sessions/${sessionId}/attendances`),
    );
  },

  async getMyAttendance(sessionId: string): Promise<AttendanceSelfResponse> {
    return unwrap<AttendanceSelfResponse>(
      http.get(`/sessions/${sessionId}/attendances/me`),
    );
  },

  async updateAttendance(
    sessionId: string,
    studentId: string,
    payload: AttendanceUpdateDto,
  ): Promise<AttendanceUpdateResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<AttendanceUpdateResponse>(
      http.patch(`/sessions/${sessionId}/attendances/${studentId}`, payload),
    );
  },
};
