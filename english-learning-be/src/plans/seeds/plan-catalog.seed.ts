import { PLAN_FEATURE_KEYS } from "../constants/plan-feature-key.constants";
import { PlanFeatureValueType } from "../entities/plan-feature.entity";
import { PlanBillingInterval } from "../entities/plan-price.entity";

export type PlanSeed = {
  code: string;
  name: string;
  description: string;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type PlanFeatureSeed =
  | {
      featureKey: string;
      valueType: PlanFeatureValueType.BOOLEAN;
      booleanValue: boolean;
    }
  | {
      featureKey: string;
      valueType: PlanFeatureValueType.NUMBER;
      numberValue: number;
    };

export type PlanPriceSeed = {
  amount: number;
  currency: string;
  interval: PlanBillingInterval;
};

export const PLAN_SEEDS: readonly PlanSeed[] = [
  {
    code: "free",
    name: "Free",
    description: "For small classes getting started",
    isPublic: true,
    isActive: true,
    sortOrder: 1,
  },
  {
    code: "intermediate",
    name: "Intermediate",
    description: "For growing English centers",
    isPublic: true,
    isActive: true,
    sortOrder: 2,
  },
  {
    code: "advanced",
    name: "Advanced",
    description: "For larger English centers with advanced needs",
    isPublic: true,
    isActive: true,
    sortOrder: 3,
  },
];

export const PLAN_FEATURE_SEEDS: Readonly<
  Record<string, readonly PlanFeatureSeed[]>
> = {
  free: [
    {
      featureKey: PLAN_FEATURE_KEYS.CUSTOM_ROLES,
      valueType: PlanFeatureValueType.BOOLEAN,
      booleanValue: false,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
      valueType: PlanFeatureValueType.BOOLEAN,
      booleanValue: false,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.MAX_STUDENTS,
      valueType: PlanFeatureValueType.NUMBER,
      numberValue: 30,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.MAX_CLASSES,
      valueType: PlanFeatureValueType.NUMBER,
      numberValue: 3,
    },
  ],

  intermediate: [
    {
      featureKey: PLAN_FEATURE_KEYS.CUSTOM_ROLES,
      valueType: PlanFeatureValueType.BOOLEAN,
      booleanValue: false,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
      valueType: PlanFeatureValueType.BOOLEAN,
      booleanValue: true,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.MAX_STUDENTS,
      valueType: PlanFeatureValueType.NUMBER,
      numberValue: 150,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.MAX_CLASSES,
      valueType: PlanFeatureValueType.NUMBER,
      numberValue: 15,
    },
  ],

  advanced: [
    {
      featureKey: PLAN_FEATURE_KEYS.CUSTOM_ROLES,
      valueType: PlanFeatureValueType.BOOLEAN,
      booleanValue: true,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
      valueType: PlanFeatureValueType.BOOLEAN,
      booleanValue: true,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.MAX_STUDENTS,
      valueType: PlanFeatureValueType.NUMBER,
      numberValue: 500,
    },
    {
      featureKey: PLAN_FEATURE_KEYS.MAX_CLASSES,
      valueType: PlanFeatureValueType.NUMBER,
      numberValue: 50,
    },
  ],
};

export const PLAN_PRICE_SEEDS: Readonly<
  Record<string, readonly PlanPriceSeed[]>
> = {
  free: [
    {
      amount: 0,
      currency: "USD",
      interval: PlanBillingInterval.MONTHLY,
    },
  ],

  intermediate: [
    {
      amount: 900, // $9.00
      currency: "USD",
      interval: PlanBillingInterval.MONTHLY,
    },
  ],

  advanced: [
    {
      amount: 1900, // $19.00
      currency: "USD",
      interval: PlanBillingInterval.MONTHLY,
    },
  ],
};
