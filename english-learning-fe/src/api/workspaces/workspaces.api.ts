import { httpClient } from "@/api/core/http-client";

export type WorkspaceMembership = {
  workspaceId: string;
  workspaceName: string;
  role: string;
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
};
