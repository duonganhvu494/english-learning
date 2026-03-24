import { httpClient } from "@/api/core/http-client";

type CreateClassRequest = {
  className: string;
  description?: string;
};

export type WorkspaceClass = {
  id: string;
  className: string;
  description?: string | null;
  workspaceId: string;
  studentCount: number;
};

export const classesApi = {
  createClass: (workspaceId: string, payload: CreateClassRequest) =>
    httpClient.post<WorkspaceClass>(
      `/workspaces/${workspaceId}/classes`,
      payload,
    ),
  listClasses: (workspaceId: string) =>
    httpClient.get<WorkspaceClass[]>(`/workspaces/${workspaceId}/classes`),
};
