import {
  PlanBillingInterval,
  PlanPrice,
} from '../entities/plan-price.entity';

export class PlanPriceResponseDto {
  id: string;

  amount: number;

  currency: string;

  interval: PlanBillingInterval;

  static fromEntity(
    price: PlanPrice,
  ): PlanPriceResponseDto {
    const dto = new PlanPriceResponseDto();

    dto.id = price.id;
    dto.amount = price.amount;
    dto.currency = price.currency;
    dto.interval = price.interval;

    return dto;
  }
}