export type WorkspaceMembership = {
  workspaceId: string;
  workspaceName: string;
  role: string;
};

export type PlanFeatureValueType = "boolean" | "number" | "string" | "json";

export type PlanFeatureValue =
  | boolean
  | number
  | string
  | Record<string, unknown>
  | unknown[]
  | null;

export type PlanFeature = {
  featureKey: string;
  valueType: PlanFeatureValueType;
  value: PlanFeatureValue;
};

export type WorkspacePlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPriceCents: number | null;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
  features: PlanFeature[];
};

export type WorkspaceSubscriptionStatus =
  | "active"
  | "trialing"
  | "suspended"
  | "cancelled"
  | "expired";

export type WorkspaceSubscription = {
  id: string;
  workspaceId: string;
  status: WorkspaceSubscriptionStatus;
  startedAt: string;
  endedAt: string | null;
  trialEndsAt: string | null;
  cancelledAt: string | null;
  source: string;
  paymentTransactionId: string | null;
  note: string | null;
  plan: WorkspacePlan;
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
