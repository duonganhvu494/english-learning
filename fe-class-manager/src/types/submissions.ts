import type { MaterialSummary } from './assignments';

export interface InitSubmissionUploadDto {
  fileName: string;
  mimeType: string;
  size: number;
}

export interface SubmissionUploadInitResponse {
  materialId: string;
  uploadSessionId: string;
  uploadId: string;
  objectKey: string;
  partSize: number;
  totalParts: number;
  expiresAt: string;
}

export interface SubmissionResponse {
  assignmentId: string;
  studentId: string;
  studentName: string | null;
  submitted: boolean;
  submittedAt: string | null;
  grade: number | null;
  score: number | null;
  feedback: string | null;
  material: MaterialSummary | null;
}

export interface ReviewSubmissionDto {
  score?: number;
  feedback?: string;
}
