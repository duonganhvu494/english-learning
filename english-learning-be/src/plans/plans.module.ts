import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Plan } from "./entities/plan.entity";
import { PlanFeature } from "./entities/plan-feature.entity";
import { PlanPrice } from "./entities/plan-price.entity";

import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { PlansSeedService } from "./plans-seed.service";

@Module({
  imports: [TypeOrmModule.forFeature([Plan, PlanFeature, PlanPrice])],

  controllers: [PlansController],

  providers: [PlansService, PlansSeedService],

  exports: [PlansService],
})
export class PlansModule {}
