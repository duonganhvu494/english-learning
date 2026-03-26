import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Plan } from './entities/plan.entity';
import {
  PlanFeature,
  PlanFeatureValueType,
} from './entities/plan-feature.entity';
import { WORKSPACE_PLAN_FEATURE_KEYS } from './constants/workspace-plan-feature-key.constants';
import { PlanResponseDto } from './dto/plan-response.dto';

type PlanSeed = {
  code: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  isPublic: boolean;
  isActive: boolean;
  sortOrder: number;
};

type PlanFeatureSeed =
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

@Injectable()
export class WorkspacePlansService implements OnModuleInit {
  private readonly planSeeds: readonly PlanSeed[] = [
    {
      code: 'free',
      name: 'Free',
      description: 'Basic plan for small classes',
      monthlyPriceCents: 0,
      isPublic: true,
      isActive: true,
      sortOrder: 1,
    },
    {
      code: 'starter',
      name: 'Starter',
      description: 'For growing English centers',
      monthlyPriceCents: 9900,
      isPublic: true,
      isActive: true,
      sortOrder: 2,
    },
    {
      code: 'pro',
      name: 'Pro',
      description: 'Advanced plan for large operations',
      monthlyPriceCents: 19900,
      isPublic: true,
      isActive: true,
      sortOrder: 3,
    },
  ];

  private readonly planFeatureSeeds: Readonly<
    Record<string, readonly PlanFeatureSeed[]>
  > = {
    free: [
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.CUSTOM_ROLES,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: false,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: false,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_STUDENTS,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: 30,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_CLASSES,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: 3,
      },
    ],
    starter: [
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.CUSTOM_ROLES,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: true,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: true,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_STUDENTS,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: 100,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_CLASSES,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: 10,
      },
    ],
    pro: [
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.CUSTOM_ROLES,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: true,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.QUIZ_ASSIGNMENTS,
        valueType: PlanFeatureValueType.BOOLEAN,
        booleanValue: true,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_STUDENTS,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: 500,
      },
      {
        featureKey: WORKSPACE_PLAN_FEATURE_KEYS.MAX_CLASSES,
        valueType: PlanFeatureValueType.NUMBER,
        numberValue: 50,
      },
    ],
  };

  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(PlanFeature)
    private readonly planFeatureRepo: Repository<PlanFeature>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPlans();
    await this.seedPlanFeatures();
  }

  async listPublicPlans(): Promise<PlanResponseDto[]> {
    const plans = await this.planRepo.find({
      where: {
        isPublic: true,
        isActive: true,
      },
      relations: {
        features: true,
      },
      order: {
        sortOrder: 'ASC',
        name: 'ASC',
      },
    });

    return plans.map((plan) => PlanResponseDto.fromEntity(plan));
  }

  private async seedPlans(): Promise<void> {
    for (const planSeed of this.planSeeds) {
      const existingPlan = await this.planRepo.findOne({
        where: { code: planSeed.code },
      });

      if (!existingPlan) {
        const plan = this.planRepo.create(planSeed);
        await this.planRepo.save(plan);
        continue;
      }

      existingPlan.name = planSeed.name;
      existingPlan.description = planSeed.description;
      existingPlan.monthlyPriceCents = planSeed.monthlyPriceCents;
      existingPlan.isPublic = planSeed.isPublic;
      existingPlan.isActive = planSeed.isActive;
      existingPlan.sortOrder = planSeed.sortOrder;
      await this.planRepo.save(existingPlan);
    }
  }

  private async seedPlanFeatures(): Promise<void> {
    for (const planSeed of this.planSeeds) {
      const plan = await this.planRepo.findOne({
        where: { code: planSeed.code },
      });
      if (!plan) {
        continue;
      }

      const featureSeeds = this.planFeatureSeeds[planSeed.code] ?? [];
      for (const featureSeed of featureSeeds) {
        const existingFeature = await this.planFeatureRepo.findOne({
          where: {
            plan: { id: plan.id },
            featureKey: featureSeed.featureKey,
          },
          relations: {
            plan: true,
          },
        });

        if (!existingFeature) {
          const feature = this.planFeatureRepo.create({
            plan,
            featureKey: featureSeed.featureKey,
            valueType: featureSeed.valueType,
            booleanValue:
              featureSeed.valueType === PlanFeatureValueType.BOOLEAN
                ? featureSeed.booleanValue
                : null,
            numberValue:
              featureSeed.valueType === PlanFeatureValueType.NUMBER
                ? String(featureSeed.numberValue)
                : null,
            stringValue: null,
            jsonValue: null,
          });
          await this.planFeatureRepo.save(feature);
          continue;
        }

        existingFeature.plan = plan;
        existingFeature.featureKey = featureSeed.featureKey;
        existingFeature.valueType = featureSeed.valueType;
        existingFeature.booleanValue =
          featureSeed.valueType === PlanFeatureValueType.BOOLEAN
            ? featureSeed.booleanValue
            : null;
        existingFeature.numberValue =
          featureSeed.valueType === PlanFeatureValueType.NUMBER
            ? String(featureSeed.numberValue)
            : null;
        existingFeature.stringValue = null;
        existingFeature.jsonValue = null;
        await this.planFeatureRepo.save(existingFeature);
      }
    }
  }
}
