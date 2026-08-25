export interface RbacRoleSeed {
  name: string;
  description: string;
}

export interface RbacPermissionSeed {
  action: string;
  resource: string;
  description: string;
}

export const DEFAULT_CLASS_STUDENT_ROLE_NAME = "student";

export const DEFAULT_CLASS_STUDENT_PERMISSION_KEYS = [
  "read:session",
  "read:lecture",
  "read:assignment",
] as const;

export const WORKSPACE_MANAGEMENT_PERMISSION_KEYS = [
  "read:workspace",

  "create:session",
  "read:session",
  "update:session",
  "delete:session",

  "read:attendance",
  "update:attendance",

  "create:lecture",
  "read:lecture",
  "update:lecture",
  "delete:lecture",

  "create:assignment",
  "read:assignment",
  "update:assignment",
  "delete:assignment",
] as const;

export const RBAC_SYSTEM_ROLES: readonly RbacRoleSeed[] = [
  {
    name: "owner",
    description: "Workspace owner with full access",
  },
  {
    name: "admin",
    description: "Workspace administrator",
  },
  {
    name: "teacher",
    description: "Teacher in workspace",
  },
  {
    name: "student",
    description: "Student in workspace",
  },
];

export const RBAC_SYSTEM_PERMISSIONS: readonly RbacPermissionSeed[] = [
  {
    action: "read",
    resource: "workspace",
    description: "View workspace information",
  },

  {
    action: "create",
    resource: "session",
    description: "Create class sessions",
  },
  {
    action: "read",
    resource: "session",
    description: "View class sessions",
  },
  {
    action: "update",
    resource: "session",
    description: "Update class sessions",
  },
  {
    action: "delete",
    resource: "session",
    description: "Delete class sessions",
  },

  {
    action: "read",
    resource: "attendance",
    description: "View session attendance",
  },
  {
    action: "update",
    resource: "attendance",
    description: "Update session attendance",
  },

  {
    action: "create",
    resource: "lecture",
    description: "Create lectures",
  },
  {
    action: "read",
    resource: "lecture",
    description: "View lectures",
  },
  {
    action: "update",
    resource: "lecture",
    description: "Update lectures",
  },
  {
    action: "delete",
    resource: "lecture",
    description: "Delete lectures",
  },

  {
    action: "create",
    resource: "assignment",
    description: "Create assignments",
  },
  {
    action: "read",
    resource: "assignment",
    description: "View assignments",
  },
  {
    action: "update",
    resource: "assignment",
    description: "Update assignments",
  },
  {
    action: "delete",
    resource: "assignment",
    description: "Delete assignments",
  },
];

export const RBAC_ROLE_PERMISSION_MAP: Readonly<
  Record<string, readonly string[]>
> = {
  owner: WORKSPACE_MANAGEMENT_PERMISSION_KEYS,
  admin: WORKSPACE_MANAGEMENT_PERMISSION_KEYS,
  teacher: WORKSPACE_MANAGEMENT_PERMISSION_KEYS,
  student: ["read:workspace"],
};
