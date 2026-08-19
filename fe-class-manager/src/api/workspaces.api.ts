import type {
  CreateStudentDto,
  CreateWorkspaceDto,
  WorkspaceDetail,
  WorkspaceResponse,
  WorkspaceStudentListItem,
  WorkspaceStudentResponse,
  WorkspaceSubscriptionResponse,
} from "@/types";

import { authApi } from "./auth.api";
import { http, unwrap } from "./http";

export const workspacesApi = {
  async createWorkspace(
    payload: CreateWorkspaceDto,
  ): Promise<WorkspaceResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<WorkspaceResponse>(
      http.post("/workspaces", payload),
    );
  },

  async getMyWorkspace(): Promise<WorkspaceDetail> {
    return unwrap<WorkspaceDetail>(
      http.get("/workspaces/me"),
    );
  },

  async getMySubscription(): Promise<WorkspaceSubscriptionResponse> {
    return unwrap<WorkspaceSubscriptionResponse>(
      http.get("/workspaces/me/subscription"),
    );
  },

  async listWorkspaceStudents(
    workspaceId: string,
  ): Promise<WorkspaceStudentListItem[]> {
    return unwrap<WorkspaceStudentListItem[]>(
      http.get(
        `/workspaces/${workspaceId}/students`,
      ),
    );
  },

  async createWorkspaceStudent(
    workspaceId: string,
    payload: CreateStudentDto,
  ): Promise<WorkspaceStudentResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<WorkspaceStudentResponse>(
      http.post(
        `/workspaces/${workspaceId}/students`,
        payload,
      ),
    );
  },
};