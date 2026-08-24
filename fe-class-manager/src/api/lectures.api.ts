import type {
  CreateLectureDto,
  LectureDeleteResponse,
  LectureResponse,
  UpdateLectureDto,
} from "@/types";

import { authApi } from "./auth.api";
import { http, unwrap } from "./http";

export const lecturesApi = {
  async createLecture(
    sessionId: string,
    payload: CreateLectureDto,
  ): Promise<LectureResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<LectureResponse>(
      http.post(`/sessions/${sessionId}/lectures`, payload),
    );
  },

  async listSessionLectures(sessionId: string): Promise<LectureResponse[]> {
    return unwrap<LectureResponse[]>(
      http.get(`/sessions/${sessionId}/lectures`),
    );
  },

  async getLectureDetail(lectureId: string): Promise<LectureResponse> {
    return unwrap<LectureResponse>(http.get(`/lectures/${lectureId}`));
  },

  async updateLecture(
    lectureId: string,
    payload: UpdateLectureDto,
  ): Promise<LectureResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<LectureResponse>(
      http.patch(`/lectures/${lectureId}`, payload),
    );
  },

  async deleteLecture(lectureId: string): Promise<LectureDeleteResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<LectureDeleteResponse>(http.delete(`/lectures/${lectureId}`));
  },

  getMaterialDownloadUrl(lectureId: string, materialId: string): string {
    return `/lectures/${lectureId}/materials/${materialId}/download`;
  },
};
