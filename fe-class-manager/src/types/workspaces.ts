import type { UserProfile } from "./users";
import type { PlanResponse } from "./plans";

export interface CreateWorkspaceDto {
  name: string;
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  owner: UserProfile;
}

export interface WorkspaceDetail {
  id: string;
  name: string;
  owner: UserProfile;
  isActive: boolean;
  currentUserRole: string;
  studentCount: number;
  classCount: number;
}

export interface CreateStudentDto {
  fullName: string;
  email: string;
}

export interface WorkspaceStudentListItem {
  studentId: string;
  fullName: string;
  userName: string;
  email: string;
  role: string;
  status: string;
}

export interface WorkspaceStudentResponse {
  workspaceId: string;

  mode:
    | "created"
    | "attached"
    | "already_assigned";

  role: string;
  user: UserProfile;
}

export type WorkspaceSubscriptionStatus =
  | "trialing"
  | "active"
  | "suspended"
  | "cancelled"
  | "expired";

export type WorkspaceSubscriptionSource =
  | "workspace_creation"
  | "billing_payment"
  | "billing_fallback"
  | "admin_override";

export interface WorkspaceSubscriptionResponse {
  id: string;
  workspaceId: string;

  status: WorkspaceSubscriptionStatus;

  startedAt: string;
  endedAt: string | null;

  trialEndsAt: string | null;
  cancelledAt: string | null;

  source: WorkspaceSubscriptionSource;

  paymentTransactionId: string | null;
  note: string | null;

  plan: PlanResponse;
}