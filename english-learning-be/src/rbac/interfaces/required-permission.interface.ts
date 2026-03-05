export interface RequiredPermission {
  action: string;
  resource: string;
  workspaceIdParam?: string;
  workspaceIdBodyField?: string;
}
