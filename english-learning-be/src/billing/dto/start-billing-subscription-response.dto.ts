import { ApiProperty } from '@nestjs/swagger';
import { BillingSubscriptionResponseDto } from './billing-subscription-response.dto';
import { PaymentTransactionResponseDto } from './payment-transaction-response.dto';
import { BillingSubscription } from '../entities/billing-subscription.entity';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

export class StartBillingSubscriptionResponseDto {
  @ApiProperty({ type: BillingSubscriptionResponseDto })
  billingSubscription: BillingSubscriptionResponseDto;

  @ApiProperty({ type: PaymentTransactionResponseDto })
  paymentTransaction: PaymentTransactionResponseDto;

  static fromData(input: {
    billingSubscription: BillingSubscription;
    paymentTransaction: PaymentTransaction;
  }): StartBillingSubscriptionResponseDto {
    const dto = new StartBillingSubscriptionResponseDto();
    dto.billingSubscription = BillingSubscriptionResponseDto.fromEntity(
      input.billingSubscription,
    );
    dto.paymentTransaction = PaymentTransactionResponseDto.fromEntity(
      input.paymentTransaction,
    );
    return dto;
  }
}
