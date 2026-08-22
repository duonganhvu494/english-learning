import { Module } from "@nestjs/common";

import { ConfigModule } from "@nestjs/config";

import { TypeOrmModule } from "@nestjs/typeorm";

import { Plan } from "./entities/plan.entity";
import { PlanFeature } from "./entities/plan-feature.entity";
import { PlanPrice } from "./entities/plan-price.entity";

import { PlansService } from "./plans.service";
import { PlansSeedService } from "./plans-seed.service";

import { PlansController } from "./plans.controller";

@Module({
  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([Plan, PlanFeature, PlanPrice]),
  ],

  controllers: [PlansController],

  providers: [PlansService, PlansSeedService],

  exports: [PlansService, TypeOrmModule],
})
export class PlansModule {}
