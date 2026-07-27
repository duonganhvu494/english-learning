import {
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from '../entities/payment-transaction.entity';

export class PaymentTransactionResponseDto {
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

  provider: string;

  providerTransactionRef: string | null;

  paidAt: string | null;

  failedAt: string | null;

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
