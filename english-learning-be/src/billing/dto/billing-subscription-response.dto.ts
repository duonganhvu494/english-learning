import { ApiProperty } from '@nestjs/swagger';
import { PlanResponseDto } from 'src/workspaces/dto/plan-response.dto';
import {
  BillingCycle,
  BillingProvider,
  BillingSubscription,
  BillingSubscriptionStatus,
} from '../entities/billing-subscription.entity';

export class BillingSubscriptionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440910' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({
    enum: BillingSubscriptionStatus,
    example: BillingSubscriptionStatus.ACTIVE,
  })
  status: BillingSubscriptionStatus;

  @ApiProperty({
    enum: BillingProvider,
    example: BillingProvider.MOCK,
  })
  provider: BillingProvider;

  @ApiProperty({
    example: 'mock-sub-1711446100000-k9x2fd',
    nullable: true,
  })
  providerSubscriptionRef: string | null;

  @ApiProperty({
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  billingCycle: BillingCycle;

  @ApiProperty({
    example: '2026-03-26T10:00:00.000Z',
    nullable: true,
  })
  activatedAt: string | null;

  @ApiProperty({
    example: '2026-03-26T10:00:00.000Z',
    nullable: true,
  })
  currentPeriodStart: string | null;

  @ApiProperty({
    example: '2026-04-26T10:00:00.000Z',
    nullable: true,
  })
  currentPeriodEnd: string | null;

  @ApiProperty({ example: false })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  cancelledAt: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  endedAt: string | null;

  @ApiProperty({ type: PlanResponseDto })
  plan: PlanResponseDto;

  static fromEntity(
    billingSubscription: BillingSubscription,
  ): BillingSubscriptionResponseDto {
    const dto = new BillingSubscriptionResponseDto();
    dto.id = billingSubscription.id;
    dto.workspaceId = billingSubscription.workspace.id;
    dto.status = billingSubscription.status;
    dto.provider = billingSubscription.provider;
    dto.providerSubscriptionRef =
      billingSubscription.providerSubscriptionRef ?? null;
    dto.billingCycle = billingSubscription.billingCycle;
    dto.activatedAt = billingSubscription.activatedAt?.toISOString() ?? null;
    dto.currentPeriodStart =
      billingSubscription.currentPeriodStart?.toISOString() ?? null;
    dto.currentPeriodEnd =
      billingSubscription.currentPeriodEnd?.toISOString() ?? null;
    dto.cancelAtPeriodEnd = billingSubscription.cancelAtPeriodEnd;
    dto.cancelledAt = billingSubscription.cancelledAt?.toISOString() ?? null;
    dto.endedAt = billingSubscription.endedAt?.toISOString() ?? null;
    dto.plan = PlanResponseDto.fromEntity(billingSubscription.plan);
    return dto;
  }
}
