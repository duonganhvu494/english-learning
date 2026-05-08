import type { PlanResponse } from './workspaces';

export type BillingSubscriptionStatus =
  | 'pending_activation'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type BillingCycle = 'monthly';
export type BillingProvider = 'mock';

export interface BillingSubscriptionResponse {
  id: string;
  workspaceId: string;
  status: BillingSubscriptionStatus;
  provider: BillingProvider | string;
  providerSubscriptionRef: string | null;
  billingCycle: BillingCycle | string;
  activatedAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  endedAt: string | null;
  plan: PlanResponse;
}

export type PaymentTransactionType = 'initial_charge' | 'recurring_charge';
export type PaymentTransactionStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled';

export interface PaymentTransactionResponse {
  id: string;
  billingSubscriptionId: string;
  workspaceId: string;
  planId: string;
  planCode: string;
  type: PaymentTransactionType | string;
  status: PaymentTransactionStatus | string;
  amountCents: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  provider: string;
  providerTransactionRef: string | null;
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
}

export interface StartBillingSubscriptionDto {
  planCode: string;
}

export interface StartBillingSubscriptionResponse {
  billingSubscription: BillingSubscriptionResponse;
  paymentTransaction: PaymentTransactionResponse;
}

export interface MarkPaymentFailedDto {
  failureReason?: string;
}
