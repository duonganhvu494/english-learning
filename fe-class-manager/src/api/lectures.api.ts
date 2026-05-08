import type { LectureResponse } from '@/types';
import { http, unwrap } from './http';

export const lecturesApi = {
  async listSessionLectures(sessionId: string): Promise<LectureResponse[]> {
    return unwrap<LectureResponse[]>(http.get(`/sessions/${sessionId}/lectures`));
  },

  async getLecture(lectureId: string): Promise<LectureResponse> {
    return unwrap<LectureResponse>(http.get(`/lectures/${lectureId}`));
  },
};
