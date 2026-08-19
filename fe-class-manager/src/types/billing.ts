import type { PlanResponse } from "./plans";

export type BillingSubscriptionStatus =
  | "pending_activation"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type BillingCycle = "monthly";

export type BillingProvider = "stripe";

export interface BillingSubscriptionResponse {
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

  plan: PlanResponse;

  nextPlan?: PlanResponse | null;
}

export interface StartBillingSubscriptionDto {
  planCode: string;
}

export interface ChangeBillingPlanDto {
  planCode: string;
}

export interface StartBillingSubscriptionResponse {
  sessionId: string;
  checkoutUrl: string;
}
