import { ApiProperty } from '@nestjs/swagger';
import {
  PlanFeature,
  PlanFeatureValueType,
} from '../entities/plan-feature.entity';

export class PlanFeatureValueResponseDto {
  @ApiProperty({ example: 'max_students' })
  featureKey: string;

  @ApiProperty({
    enum: PlanFeatureValueType,
    example: PlanFeatureValueType.NUMBER,
  })
  valueType: PlanFeatureValueType;

  @ApiProperty({
    example: 100,
    nullable: true,
    description:
      'Normalized feature value. The actual shape depends on valueType.',
  })
  value: boolean | number | string | Record<string, unknown> | unknown[] | null;

  static fromEntity(feature: PlanFeature): PlanFeatureValueResponseDto {
    const dto = new PlanFeatureValueResponseDto();
    dto.featureKey = feature.featureKey;
    dto.valueType = feature.valueType;
    dto.value = PlanFeatureValueResponseDto.resolveValue(feature);
    return dto;
  }

  private static resolveValue(
    feature: PlanFeature,
  ): boolean | number | string | Record<string, unknown> | unknown[] | null {
    switch (feature.valueType) {
      case PlanFeatureValueType.BOOLEAN:
        return feature.booleanValue;
      case PlanFeatureValueType.NUMBER:
        return feature.numberValue === null ? null : Number(feature.numberValue);
      case PlanFeatureValueType.STRING:
        return feature.stringValue;
      case PlanFeatureValueType.JSON:
        return feature.jsonValue;
      default:
        return null;
    }
  }
}
