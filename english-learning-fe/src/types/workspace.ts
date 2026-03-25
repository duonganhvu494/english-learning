export type WorkspaceMembership = {
  workspaceId: string;
  workspaceName: string;
  role: string;
};

export type CurrentWorkspaceDetail = {
  id: string;
  name: string;
  currentUserRole?: string;
};

export type MyWorkspacesResult = WorkspaceMembership[] | CurrentWorkspaceDetail;

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
