import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Plan } from "./entities/plan.entity";
import {
  PlanFeature,
  PlanFeatureValueType,
} from "./entities/plan-feature.entity";
import { PlanPrice } from "./entities/plan-price.entity";

import {
  PLAN_FEATURE_SEEDS,
  PLAN_PRICE_SEEDS,
  PLAN_SEEDS,
} from "./seeds/plan-catalog.seed";

@Injectable()
export class PlansSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(PlanFeature)
    private readonly planFeatureRepo: Repository<PlanFeature>,

    @InjectRepository(PlanPrice)
    private readonly planPriceRepo: Repository<PlanPrice>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedPlans();
    await this.seedPlanFeatures();
    await this.seedPlanPrices();
  }

  private async seedPlans(): Promise<void> {
    for (const planSeed of PLAN_SEEDS) {
      const existing = await this.planRepo.findOne({
        where: {
          code: planSeed.code,
        },
      });

      if (!existing) {
        await this.planRepo.save(this.planRepo.create(planSeed));
        continue;
      }

      existing.name = planSeed.name;
      existing.description = planSeed.description;
      existing.isPublic = planSeed.isPublic;
      existing.isActive = planSeed.isActive;
      existing.sortOrder = planSeed.sortOrder;

      await this.planRepo.save(existing);
    }
  }

  private async seedPlanFeatures(): Promise<void> {
    for (const planSeed of PLAN_SEEDS) {
      const plan = await this.planRepo.findOne({
        where: {
          code: planSeed.code,
        },
      });

      if (!plan) {
        continue;
      }

      const featureSeeds = PLAN_FEATURE_SEEDS[planSeed.code] ?? [];

      for (const featureSeed of featureSeeds) {
        const existingFeature = await this.planFeatureRepo.findOne({
          where: {
            plan: {
              id: plan.id,
            },
            featureKey: featureSeed.featureKey,
          },
        });

        if (!existingFeature) {
          await this.planFeatureRepo.save(
            this.planFeatureRepo.create({
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
            }),
          );

          continue;
        }

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

  private async seedPlanPrices(): Promise<void> {
    for (const [planCode, priceSeeds] of Object.entries(PLAN_PRICE_SEEDS)) {
      const plan = await this.planRepo.findOne({
        where: {
          code: planCode,
        },
      });

      if (!plan) {
        continue;
      }

      for (const priceSeed of priceSeeds) {
        const currency = priceSeed.currency.trim().toUpperCase();

        const existingPrice = await this.planPriceRepo.findOne({
          where: {
            plan: {
              id: plan.id,
            },
            currency,
            interval: priceSeed.interval,
            isActive: true,
          },
        });

        if (!existingPrice) {
          await this.planPriceRepo.save(
            this.planPriceRepo.create({
              plan,
              amount: priceSeed.amount,
              currency,
              interval: priceSeed.interval,
              isActive: true,
            }),
          );

          continue;
        }

        if (existingPrice.amount === priceSeed.amount) {
          continue;
        }

        existingPrice.isActive = false;

        await this.planPriceRepo.save(existingPrice);

        await this.planPriceRepo.save(
          this.planPriceRepo.create({
            plan,
            amount: priceSeed.amount,
            currency,
            interval: priceSeed.interval,
            isActive: true,
          }),
        );
      }
    }
  }
}
