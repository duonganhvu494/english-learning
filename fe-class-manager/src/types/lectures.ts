import type { MaterialSummary } from "./materials";

export interface CreateLectureDto {
  title: string;
  description?: string;
  materialIds?: string[];
}

export interface UpdateLectureDto {
  title?: string;
  description?: string;
  materialIds?: string[];
}

export interface LectureResponse {
  id: string;
  code: string | null;
  sessionId: string;
  classId: string;
  title: string;
  description: string | null;
  materials: MaterialSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface LectureDeleteResponse {
  lectureId: string;
}