import { ApiProperty } from '@nestjs/swagger';
import {
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from '../entities/payment-transaction.entity';

export class PaymentTransactionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440920' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440910' })
  billingSubscriptionId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440700' })
  planId: string;

  @ApiProperty({ example: 'starter' })
  planCode: string;

  @ApiProperty({
    enum: PaymentTransactionType,
    example: PaymentTransactionType.INITIAL_CHARGE,
  })
  type: PaymentTransactionType;

  @ApiProperty({
    enum: PaymentTransactionStatus,
    example: PaymentTransactionStatus.PENDING,
  })
  status: PaymentTransactionStatus;

  @ApiProperty({ example: 9900 })
  amountCents: number;

  @ApiProperty({ example: '2026-03-26T10:00:00.000Z' })
  billingPeriodStart: string;

  @ApiProperty({ example: '2026-04-26T10:00:00.000Z' })
  billingPeriodEnd: string;

  @ApiProperty({
    example: 'mock',
  })
  provider: string;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  providerTransactionRef: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  paidAt: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  failedAt: string | null;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  failureReason: string | null;

  static fromEntity(
    paymentTransaction: PaymentTransaction,
  ): PaymentTransactionResponseDto {
    const dto = new PaymentTransactionResponseDto();
    dto.id = paymentTransaction.id;
    dto.billingSubscriptionId = paymentTransaction.billingSubscription.id;
    dto.workspaceId = paymentTransaction.workspace.id;
    dto.planId = paymentTransaction.plan.id;
    dto.planCode = paymentTransaction.plan.code;
    dto.type = paymentTransaction.type;
    dto.status = paymentTransaction.status;
    dto.amountCents = paymentTransaction.amountCents;
    dto.billingPeriodStart = paymentTransaction.billingPeriodStart.toISOString();
    dto.billingPeriodEnd = paymentTransaction.billingPeriodEnd.toISOString();
    dto.provider = paymentTransaction.provider;
    dto.providerTransactionRef = paymentTransaction.providerTransactionRef ?? null;
    dto.paidAt = paymentTransaction.paidAt?.toISOString() ?? null;
    dto.failedAt = paymentTransaction.failedAt?.toISOString() ?? null;
    dto.failureReason = paymentTransaction.failureReason ?? null;
    return dto;
  }
}
