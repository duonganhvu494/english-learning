import { ApiProperty } from '@nestjs/swagger';
import {
  WorkspaceSubscriptionSource,
  WorkspaceSubscription,
  WorkspaceSubscriptionStatus,
} from '../entities/workspace-subscription.entity';
import { PlanResponseDto } from './plan-response.dto';

export class WorkspaceSubscriptionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440900' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({
    enum: WorkspaceSubscriptionStatus,
    example: WorkspaceSubscriptionStatus.ACTIVE,
  })
  status: WorkspaceSubscriptionStatus;

  @ApiProperty({ example: '2026-03-25T10:00:00.000Z' })
  startedAt: string;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  endedAt: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  trialEndsAt: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  cancelledAt: string | null;

  @ApiProperty({
    enum: WorkspaceSubscriptionSource,
    example: WorkspaceSubscriptionSource.WORKSPACE_CREATION,
  })
  source: WorkspaceSubscriptionSource;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  paymentTransactionId: string | null;

  @ApiProperty({
    example: 'Assigned free plan on workspace creation',
    nullable: true,
  })
  note: string | null;

  @ApiProperty({ type: PlanResponseDto })
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
