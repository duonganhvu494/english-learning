import { httpClient } from "@/api/core/http-client";

export type WorkspaceMembership = {
  workspaceId: string;
  workspaceName: string;
  role: string;
};

export type WorkspaceStudentListItem = {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  role: string;
  status: string;
};

export type CreateWorkspaceStudentRequest = {
  fullName: string;
  userName: string;
  email: string;
};

export type CreateWorkspaceStudentResponse = {
  workspaceId: string;
  role: string;
  plainPassword: string;
  user: {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    mustChangePassword: boolean;
  };
};

export type UpdateWorkspaceStudentRequest = Partial<{
  fullName: string;
  userName: string;
  email: string;
}>;

export type RemoveWorkspaceStudentResponse = {
  workspaceId: string;
  studentId: string;
  removedClassCount: number;
};

export type CreateWorkspaceRequest = {
  name: string;
};

export type CreateWorkspaceResponse = {
  id: string;
  name: string;
  owner: {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    mustChangePassword: boolean;
  };
};

export const workspacesApi = {
  createWorkspace: (payload: CreateWorkspaceRequest) =>
    httpClient.post<CreateWorkspaceResponse>("/workspaces", payload),
  myWorkspaces: () => httpClient.get<WorkspaceMembership[]>("/workspaces/me"),
  createStudent: (workspaceId: string, payload: CreateWorkspaceStudentRequest) =>
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
