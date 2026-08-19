export type PlanFeatureValueType =
  | "boolean"
  | "number"
  | "string"
  | "json";

export type PlanFeatureValueData =
  | boolean
  | number
  | string
  | Record<string, unknown>
  | unknown[]
  | null;

export interface PlanFeatureValue {
  featureKey: string;
  valueType: PlanFeatureValueType;
  value: PlanFeatureValueData;
}

export type PlanBillingInterval = "monthly";

export interface PlanPrice {
  id: string;
  amount: number;
  currency: string;
  interval: PlanBillingInterval;
}

export interface PlanResponse {
  id: string;
  code: string;
  name: string;
  description: string | null;

  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;

  features: PlanFeatureValue[];
  prices: PlanPrice[];
}