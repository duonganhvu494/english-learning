import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '../entities/plan.entity';
import { PlanFeatureValueResponseDto } from './plan-feature-value-response.dto';

export class PlanResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440700' })
  id: string;

  @ApiProperty({ example: 'starter' })
  code: string;

  @ApiProperty({ example: 'Starter' })
  name: string;

  @ApiProperty({ example: 'For growing English centers', nullable: true })
  description: string | null;

  @ApiProperty({ example: 9900, nullable: true })
  monthlyPriceCents: number | null;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 2 })
  sortOrder: number;

  @ApiProperty({ type: PlanFeatureValueResponseDto, isArray: true })
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
