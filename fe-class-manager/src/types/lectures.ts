import type { MaterialSummary } from './assignments';

export interface CreateLectureDto {
  title: string;
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
