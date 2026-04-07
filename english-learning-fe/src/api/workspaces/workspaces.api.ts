import { httpClient } from "@/api/core/http-client";
import type { WorkspacePlan, WorkspaceSubscription } from "@/types/billing";
import type {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  CreateWorkspaceStudentRequest,
  CreateWorkspaceStudentResponse,
  MyWorkspacesResult,
  RemoveWorkspaceStudentResponse,
  UpdateWorkspaceStudentRequest,
  WorkspaceStudentListItem,
} from "@/types/workspace";

export const workspacesApi = {
  createWorkspace: (payload: CreateWorkspaceRequest) =>
    httpClient.post<CreateWorkspaceResponse>("/workspaces", payload),
  myWorkspaces: () => httpClient.get<MyWorkspacesResult>("/workspaces/me"),
  getMySubscription: () =>
    httpClient.get<WorkspaceSubscription>("/workspaces/me/subscription"),
  myWorkspaceSubscription: () =>
    httpClient.get<WorkspaceSubscription>("/workspaces/me/subscription"),
  listPlans: () => httpClient.get<WorkspacePlan[]>("/workspaces/plans"),
  createStudent: (
    workspaceId: string,
    payload: CreateWorkspaceStudentRequest,
  ) =>
    httpClient.post<CreateWorkspaceStudentResponse>(
      `/workspaces/${workspaceId}/students`,
      payload,
    ),
  listStudents: (workspaceId: string) =>
    httpClient.get<WorkspaceStudentListItem[]>(
      `/workspaces/${workspaceId}/students`,
    ),
  updateStudent: (
    workspaceId: string,
    studentId: string,
    payload: UpdateWorkspaceStudentRequest,
  ) =>
    httpClient.patch<WorkspaceStudentListItem>(
      `/workspaces/${workspaceId}/students/${studentId}`,
      payload,
    ),
  removeStudent: (workspaceId: string, studentId: string) =>
    httpClient.remove<RemoveWorkspaceStudentResponse>(
      `/workspaces/${workspaceId}/students/${studentId}`,
    ),
};
