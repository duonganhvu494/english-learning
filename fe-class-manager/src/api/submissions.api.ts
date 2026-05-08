import type {
  InitSubmissionUploadDto,
  ReviewSubmissionDto,
  SubmissionResponse,
  SubmissionUploadInitResponse,
} from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

export const submissionsApi = {
  async initMyUpload(
    assignmentId: string,
    payload: InitSubmissionUploadDto,
  ): Promise<SubmissionUploadInitResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<SubmissionUploadInitResponse>(
      http.post(`/assignments/${assignmentId}/submissions/me/upload-init`, payload),
    );
  },

  async getMySubmission(assignmentId: string): Promise<SubmissionResponse> {
    return unwrap<SubmissionResponse>(
      http.get(`/assignments/${assignmentId}/submissions/me`),
    );
  },

  async listAssignmentSubmissions(assignmentId: string): Promise<SubmissionResponse[]> {
    return unwrap<SubmissionResponse[]>(
      http.get(`/assignments/${assignmentId}/submissions`),
    );
  },

  async getStudentSubmission(
    assignmentId: string,
    studentId: string,
  ): Promise<SubmissionResponse> {
    return unwrap<SubmissionResponse>(
      http.get(`/assignments/${assignmentId}/submissions/${studentId}`),
    );
  },

  async reviewSubmission(
    assignmentId: string,
    studentId: string,
    payload: ReviewSubmissionDto,
  ): Promise<SubmissionResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<SubmissionResponse>(
      http.patch(`/assignments/${assignmentId}/submissions/${studentId}/review`, payload),
    );
  },
};
