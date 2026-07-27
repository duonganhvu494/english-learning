import { Plan } from '../entities/plan.entity';
import { PlanFeatureValueResponseDto } from './plan-feature-value-response.dto';

export class PlanResponseDto {
  id: string;

  code: string;

  name: string;

  description: string | null;

  monthlyPriceCents: number | null;

  isPublic: boolean;

  isActive: boolean;

  sortOrder: number;

  features: PlanFeatureValueResponseDto[];

  static fromEntity(plan: Plan): PlanResponseDto {
    const dto = new PlanResponseDto();
    dto.id = plan.id;
    dto.code = plan.code;
    dto.name = plan.name;
    dto.description = plan.description;
    dto.monthlyPriceCents = plan.monthlyPriceCents;
    dto.isPublic = plan.isPublic;
    dto.isActive = plan.isActive;
    dto.sortOrder = plan.sortOrder;
    dto.features = [...(plan.features ?? [])]
      .sort((a, b) => a.featureKey.localeCompare(b.featureKey))
      .map((feature) => PlanFeatureValueResponseDto.fromEntity(feature));
    return dto;
  }
}
