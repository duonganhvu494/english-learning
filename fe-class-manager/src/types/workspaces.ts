import type { UserProfile } from './users';

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
  mode: 'created' | 'attached' | 'already_assigned';
  role: string;
  user: UserProfile;
}

export interface PlanFeatureValue {
  featureKey: string;
  valueType: string;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
}

export interface PlanResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number | null;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  features: PlanFeatureValue[];
}

export interface WorkspaceSubscriptionResponse {
  id: string;
  workspaceId: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  source: string;
  paymentTransactionId: string | null;
  note: string | null;
  plan: PlanResponse;
}
