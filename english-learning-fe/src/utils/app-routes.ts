export const TEACHER_BASE_PATH = "/teacher";
export const STUDENT_BASE_PATH = "/student";

export type AppRole = "teacher" | "student";

export function resolveAppRoleFromWorkspaceRole(role: string | null | undefined): AppRole {
  return role?.trim().toLowerCase() === "student" ? "student" : "teacher";
}

export function getBasePathByRole(role: AppRole): string {
  return role === "student" ? STUDENT_BASE_PATH : TEACHER_BASE_PATH;
}

export function getDashboardPathByRole(role: AppRole): string {
  return `${getBasePathByRole(role)}/dashboard`;
}

export function getProfilePathByRole(role: AppRole): string {
  return `${getBasePathByRole(role)}/profile`;
}

export function getSettingsPathByRole(role: AppRole): string {
  return `${getBasePathByRole(role)}/settings`;
}

export function getBillingPathByRole(role: AppRole): string {
  return role === "teacher" ? `${TEACHER_BASE_PATH}/billing` : `${STUDENT_BASE_PATH}/settings`;
}

export function getNotificationsPathByRole(role: AppRole): string {
  return `${getBasePathByRole(role)}/notifications`;
}
