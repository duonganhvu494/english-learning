export type PlanFeatureValueType = "boolean" | "number" | "string" | "json";

export type PlanFeatureValue = {
  featureKey: string;
  valueType: PlanFeatureValueType;
  value:
    | boolean
    | number
    | string
    | Record<string, unknown>
    | unknown[]
    | null;
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
  features: PlanFeatureValue[];
};

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

export type WorkspaceSubscription = {
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
  plan: WorkspacePlan;
};

export type BillingProvider = "mock";
export type BillingCycle = "monthly";

export type BillingSubscriptionStatus =
  | "pending_activation"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type BillingSubscription = {
  id: string;
  workspaceId: string;
  status: BillingSubscriptionStatus;
  provider: BillingProvider;
  providerSubscriptionRef: string | null;
  billingCycle: BillingCycle;
  activatedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  endedAt: string | null;
  plan: WorkspacePlan;
};

export type PaymentTransactionType = "initial_charge" | "recurring_charge";
export type PaymentTransactionStatus = "pending" | "paid" | "failed" | "cancelled";

export type PaymentTransaction = {
  id: string;
  billingSubscriptionId: string;
  workspaceId: string;
  planId: string;
  planCode: string;
  type: PaymentTransactionType;
  status: PaymentTransactionStatus;
  amountCents: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  provider: BillingProvider;
  providerTransactionRef: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
};

export type StartBillingSubscriptionRequest = {
  planCode: string;
};

export type StartBillingSubscriptionResponse = {
  billingSubscription: BillingSubscription;
  paymentTransaction: PaymentTransaction;
};

export type MarkPaymentFailedRequest = {
  failureReason?: string;
};
