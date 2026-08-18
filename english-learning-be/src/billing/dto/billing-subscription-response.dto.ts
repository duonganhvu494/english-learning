import { PlanResponseDto } from "src/plans/dto/plan-response.dto";

import {
  BillingCycle,
  BillingProvider,
  BillingSubscription,
  BillingSubscriptionStatus,
} from "../entities/billing-subscription.entity";

export class BillingSubscriptionResponseDto {
  id: string;

  workspaceId: string;

  status: BillingSubscriptionStatus;

  provider: BillingProvider;

  providerSubscriptionRef:
    string | null;

  billingCycle: BillingCycle;

  activatedAt:
    string | null;

  currentPeriodStart:
    string | null;

  currentPeriodEnd:
    string | null;

  cancelAtPeriodEnd:
    boolean;

  cancelledAt:
    string | null;

  endedAt:
    string | null;

  plan:
    PlanResponseDto;

  nextPlan:
    PlanResponseDto | null;

  static fromEntity(
    billingSubscription:
      BillingSubscription,
  ): BillingSubscriptionResponseDto {
    const dto =
      new BillingSubscriptionResponseDto();

    dto.id =
      billingSubscription.id;

    dto.workspaceId =
      billingSubscription.workspace.id;

    dto.status =
      billingSubscription.status;

    dto.provider =
      billingSubscription.provider;

    dto.providerSubscriptionRef =
      billingSubscription
        .providerSubscriptionRef ??
      null;

    dto.billingCycle =
      billingSubscription.billingCycle;

    dto.activatedAt =
      billingSubscription
        .activatedAt
        ?.toISOString() ??
      null;

    dto.currentPeriodStart =
      billingSubscription
        .currentPeriodStart
        ?.toISOString() ??
      null;

    dto.currentPeriodEnd =
      billingSubscription
        .currentPeriodEnd
        ?.toISOString() ??
      null;

    dto.cancelAtPeriodEnd =
      billingSubscription
        .cancelAtPeriodEnd;

    dto.cancelledAt =
      billingSubscription
        .cancelledAt
        ?.toISOString() ??
      null;

    dto.endedAt =
      billingSubscription
        .endedAt
        ?.toISOString() ??
      null;

    dto.plan =
      PlanResponseDto.fromEntity(
        billingSubscription.plan,
      );

    dto.nextPlan =
      billingSubscription.nextPlan
        ? PlanResponseDto.fromEntity(
            billingSubscription.nextPlan,
          )
        : null;

    return dto;
  }
}
