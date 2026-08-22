import {
  WorkspaceSubscriptionSource,
  WorkspaceSubscription,
  WorkspaceSubscriptionStatus,
} from "../entities/workspace-subscription.entity";

import { PlanResponseDto } from "src/plans/dto/plan-response.dto";

export class WorkspaceSubscriptionResponseDto {
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

  plan: PlanResponseDto;

  static fromEntity(
    subscription: WorkspaceSubscription,
  ): WorkspaceSubscriptionResponseDto {
    const dto = new WorkspaceSubscriptionResponseDto();

    dto.id = subscription.id;
    dto.workspaceId = subscription.workspace.id;
    dto.status = subscription.status;
    dto.startedAt = subscription.startedAt.toISOString();
    dto.endedAt = subscription.endedAt?.toISOString() ?? null;
    dto.trialEndsAt = subscription.trialEndsAt?.toISOString() ?? null;
    dto.cancelledAt = subscription.cancelledAt?.toISOString() ?? null;
    dto.source = subscription.source;
    dto.paymentTransactionId = subscription.paymentTransactionId ?? null;
    dto.note = subscription.note;

    dto.plan = PlanResponseDto.fromEntity(subscription.plan);

    return dto;
  }
}
