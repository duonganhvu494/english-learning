import type {
  AbortMaterialUploadDto,
  CompleteMaterialUploadDto,
  InitSubmissionUploadDto,
  MaterialUploadAbortResponse,
  MaterialUploadInitResponse,
  MaterialUploadPartSignedResponse,
  ReviewSubmissionDto,
  SignMaterialUploadPartDto,
  SubmissionResponse,
} from "@/types";

import { authApi } from "./auth.api";
import { http, unwrap } from "./http";

export const submissionsApi = {
  async initMyUpload(
    assignmentId: string,
    payload: InitSubmissionUploadDto,
  ): Promise<MaterialUploadInitResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<MaterialUploadInitResponse>(
      http.post(
        `/assignments/${assignmentId}/submissions/me/upload-init`,
        payload,
      ),
    );
  },

  async signMyUploadPart(
    assignmentId: string,
    payload: SignMaterialUploadPartDto,
  ): Promise<MaterialUploadPartSignedResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<MaterialUploadPartSignedResponse>(
      http.post(
        `/assignments/${assignmentId}/submissions/me/upload-sign-part`,
        payload,
      ),
    );
  },

  async completeMyUpload(
    assignmentId: string,
    payload: CompleteMaterialUploadDto,
  ): Promise<SubmissionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<SubmissionResponse>(
      http.post(
        `/assignments/${assignmentId}/submissions/me/upload-complete`,
        payload,
      ),
    );
  },

  async abortMyUpload(
    assignmentId: string,
    payload: AbortMaterialUploadDto,
  ): Promise<MaterialUploadAbortResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<MaterialUploadAbortResponse>(
      http.post(
        `/assignments/${assignmentId}/submissions/me/upload-abort`,
        payload,
      ),
    );
  },

  async getMySubmission(assignmentId: string): Promise<SubmissionResponse> {
    return unwrap<SubmissionResponse>(
      http.get(`/assignments/${assignmentId}/submissions/me`),
    );
  },

  async listAssignmentSubmissions(
    assignmentId: string,
  ): Promise<SubmissionResponse[]> {
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
      http.patch(
        `/assignments/${assignmentId}/submissions/${studentId}/review`,
        payload,
      ),
    );
  },
};
