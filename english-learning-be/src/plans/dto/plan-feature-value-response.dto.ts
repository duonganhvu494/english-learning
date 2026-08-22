import {
  PlanFeature,
  PlanFeatureValueType,
} from "../entities/plan-feature.entity";

export type PlanFeatureValue =
  boolean | number | string | Record<string, unknown> | unknown[];

export class PlanFeatureValueResponseDto {
  featureKey: string;

  valueType: PlanFeatureValueType;

  value: PlanFeatureValue;

  static fromEntity(feature: PlanFeature): PlanFeatureValueResponseDto {
    const dto = new PlanFeatureValueResponseDto();

    dto.featureKey = feature.featureKey;
    dto.valueType = feature.valueType;
    dto.value = this.resolveValue(feature);

    return dto;
  }

  private static resolveValue(feature: PlanFeature): PlanFeatureValue {
    switch (feature.valueType) {
      case PlanFeatureValueType.BOOLEAN:
        return feature.booleanValue ?? false;

      case PlanFeatureValueType.NUMBER:
        return Number(feature.numberValue ?? 0);

      case PlanFeatureValueType.STRING:
        return feature.stringValue ?? "";

      case PlanFeatureValueType.JSON:
        return feature.jsonValue ?? {};

      default:
        throw new Error(
          `Unsupported plan feature value type: ${feature.valueType}`,
        );
    }
  }
}
