import { Plan } from '../entities/plan.entity';

import { PlanFeatureValueResponseDto } from './plan-feature-value-response.dto';
import { PlanPriceResponseDto } from './plan-price-response.dto';

export class PlanResponseDto {
  id: string;

  code: string;

  name: string;

  description: string | null;

  isPublic: boolean;

  isActive: boolean;

  sortOrder: number;

  features: PlanFeatureValueResponseDto[];

  prices: PlanPriceResponseDto[];

  static fromEntity(
    plan: Plan,
  ): PlanResponseDto {
    const dto = new PlanResponseDto();

    dto.id = plan.id;
    dto.code = plan.code;
    dto.name = plan.name;
    dto.description = plan.description;
    dto.isPublic = plan.isPublic;
    dto.isActive = plan.isActive;
    dto.sortOrder = plan.sortOrder;

    dto.features = [...(plan.features ?? [])]
      .sort((left, right) =>
        left.featureKey.localeCompare(
          right.featureKey,
        ),
      )
      .map((feature) =>
        PlanFeatureValueResponseDto.fromEntity(
          feature,
        ),
      );

    dto.prices = [...(plan.prices ?? [])]
      .filter((price) => price.isActive)
      .sort((left, right) => {
        const currencyComparison =
          left.currency.localeCompare(
            right.currency,
          );

        if (currencyComparison !== 0) {
          return currencyComparison;
        }

        return left.interval.localeCompare(
          right.interval,
        );
      })
      .map((price) =>
        PlanPriceResponseDto.fromEntity(price),
      );

    return dto;
  }
}