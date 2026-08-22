import { Injectable, NotFoundException } from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";

import { Repository } from "typeorm";

import { errorPayload } from "src/common/utils/error-payload.util";

import { PlanResponseDto } from "./dto/plan-response.dto";

import { Plan } from "./entities/plan.entity";

import { PlanBillingInterval, PlanPrice } from "./entities/plan-price.entity";

@Injectable()
export class PlansService {
  private readonly defaultPlanCode = "free";

  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(PlanPrice)
    private readonly planPriceRepo: Repository<PlanPrice>,
  ) {}

  async listPublicPlans(): Promise<PlanResponseDto[]> {
    const plans = await this.planRepo.find({
      where: {
        isPublic: true,

        isActive: true,
      },

      relations: {
        features: true,

        prices: true,
      },

      order: {
        sortOrder: "ASC",

        name: "ASC",
      },
    });

    return plans.map((plan) => PlanResponseDto.fromEntity(plan));
  }

  async getPublicPlan(code: string): Promise<PlanResponseDto> {
    const normalizedCode = this.normalizePlanCode(code);

    const plan = await this.planRepo.findOne({
      where: {
        code: normalizedCode,

        isPublic: true,

        isActive: true,
      },

      relations: {
        features: true,

        prices: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(
        errorPayload("Plan not found", "PLAN_NOT_FOUND"),
      );
    }

    return PlanResponseDto.fromEntity(plan);
  }

  async getPlanByCodeOrThrow(code: string): Promise<Plan> {
    const normalizedCode = this.normalizePlanCode(code);

    const plan = await this.planRepo.findOne({
      where: {
        code: normalizedCode,

        isActive: true,
      },

      relations: {
        features: true,

        prices: true,
      },
    });

    if (!plan) {
      throw new NotFoundException(
        errorPayload("Plan not found", "PLAN_NOT_FOUND"),
      );
    }

    return plan;
  }

  async getDefaultPlan(): Promise<Plan> {
    return this.getPlanByCodeOrThrow(this.defaultPlanCode);
  }

  async getActivePriceOrThrow(
    planCode: string,
    currency: string,
    interval: PlanBillingInterval,
  ): Promise<PlanPrice> {
    const plan = await this.getPlanByCodeOrThrow(planCode);

    const normalizedCurrency = this.normalizeCurrency(currency);

    const price = plan.prices.find(
      (candidate) =>
        candidate.isActive &&
        candidate.currency === normalizedCurrency &&
        candidate.interval === interval,
    );

    if (!price) {
      throw new NotFoundException(
        errorPayload("Active plan price not found", "PLAN_PRICE_NOT_FOUND"),
      );
    }

    return price;
  }

  async getPlanByStripePriceIdOrThrow(stripePriceId: string): Promise<Plan> {
    const price = await this.planPriceRepo.findOne({
      where: {
        stripePriceId,
      },

      relations: {
        plan: {
          features: true,

          prices: true,
        },
      },
    });

    if (!price) {
      throw new NotFoundException(
        errorPayload(
          "Plan for Stripe price not found",
          "PLAN_STRIPE_PRICE_NOT_FOUND",
        ),
      );
    }

    return price.plan;
  }

  private normalizePlanCode(code: string): string {
    return code.trim().toLowerCase();
  }

  private normalizeCurrency(currency: string): string {
    return currency.trim().toUpperCase();
  }
}
