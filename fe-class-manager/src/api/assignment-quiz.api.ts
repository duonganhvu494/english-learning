import type {
  AssignmentQuizAttemptResponse,
  AssignmentQuizManagementResponse,
  AssignmentQuizOptionDeleteResponse,
  AssignmentQuizQuestionDeleteResponse,
  AssignmentQuizQuestionResponse,
  AssignmentQuizResponse,
  CreateAssignmentQuizOptionDto,
  CreateAssignmentQuizQuestionDto,
  SubmitAssignmentQuizAttemptDto,
  UpdateAssignmentQuizOptionDto,
  UpdateAssignmentQuizQuestionDto,
} from "@/types";
import { authApi } from "./auth.api";
import { http, unwrap } from "./http";

export const assignmentQuizApi = {
  async getManagement(
    assignmentId: string,
  ): Promise<AssignmentQuizManagementResponse> {
    return unwrap<AssignmentQuizManagementResponse>(
      http.get(`/assignments/${assignmentId}/quiz/manage`),
    );
  },

  async getQuiz(assignmentId: string): Promise<AssignmentQuizResponse> {
    return unwrap<AssignmentQuizResponse>(
      http.get(`/assignments/${assignmentId}/quiz`),
    );
  },

  async createQuestion(
    assignmentId: string,
    payload: CreateAssignmentQuizQuestionDto,
  ): Promise<AssignmentQuizQuestionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizQuestionResponse>(
      http.post(`/assignments/${assignmentId}/quiz/questions`, payload),
    );
  },

  async updateQuestion(
    assignmentId: string,
    questionId: string,
    payload: UpdateAssignmentQuizQuestionDto,
  ): Promise<AssignmentQuizQuestionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizQuestionResponse>(
      http.patch(
        `/assignments/${assignmentId}/quiz/questions/${questionId}`,
        payload,
      ),
    );
  },

  async deleteQuestion(
    assignmentId: string,
    questionId: string,
  ): Promise<AssignmentQuizQuestionDeleteResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizQuestionDeleteResponse>(
      http.delete(`/assignments/${assignmentId}/quiz/questions/${questionId}`),
    );
  },

  async createOption(
    assignmentId: string,
    questionId: string,
    payload: CreateAssignmentQuizOptionDto,
  ): Promise<AssignmentQuizQuestionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizQuestionResponse>(
      http.post(
        `/assignments/${assignmentId}/quiz/questions/${questionId}/options`,
        payload,
      ),
    );
  },

  async updateOption(
    assignmentId: string,
    optionId: string,
    payload: UpdateAssignmentQuizOptionDto,
  ): Promise<AssignmentQuizQuestionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizQuestionResponse>(
      http.patch(
        `/assignments/${assignmentId}/quiz/options/${optionId}`,
        payload,
      ),
    );
  },

  async deleteOption(
    assignmentId: string,
    optionId: string,
  ): Promise<AssignmentQuizOptionDeleteResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizOptionDeleteResponse>(
      http.delete(`/assignments/${assignmentId}/quiz/options/${optionId}`),
    );
  },

  async startMyAttempt(
    assignmentId: string,
  ): Promise<AssignmentQuizAttemptResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizAttemptResponse>(
      http.post(`/assignments/${assignmentId}/quiz/attempts/me/start`),
    );
  },

  async getMyAttempt(
    assignmentId: string,
  ): Promise<AssignmentQuizAttemptResponse> {
    return unwrap<AssignmentQuizAttemptResponse>(
      http.get(`/assignments/${assignmentId}/quiz/attempts/me`),
    );
  },

  async submitMyAttempt(
    assignmentId: string,
    payload: SubmitAssignmentQuizAttemptDto,
  ): Promise<AssignmentQuizAttemptResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<AssignmentQuizAttemptResponse>(
      http.post(
        `/assignments/${assignmentId}/quiz/attempts/me/submit`,
        payload,
      ),
    );
  },

  async listAttempts(
    assignmentId: string,
  ): Promise<AssignmentQuizAttemptResponse[]> {
    return unwrap<AssignmentQuizAttemptResponse[]>(
      http.get(`/assignments/${assignmentId}/quiz/attempts`),
    );
  },

  async getAttempt(
    assignmentId: string,
    studentId: string,
  ): Promise<AssignmentQuizAttemptResponse> {
    return unwrap<AssignmentQuizAttemptResponse>(
      http.get(`/assignments/${assignmentId}/quiz/attempts/${studentId}`),
    );
  },
};
