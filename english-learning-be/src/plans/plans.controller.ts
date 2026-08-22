import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { ApiResponse } from 'src/common/dto/api-response.dto';

import { PlanResponseDto } from './dto/plan-response.dto';
import { PlansService } from './plans.service';

@Controller('plans')
export class PlansController {
  constructor(
    private readonly plansService:
      PlansService,
  ) {}

  @Get()
  async listPlans(): Promise<
    ApiResponse<PlanResponseDto[]>
  > {
    const result =
      await this.plansService.listPublicPlans();

    return ApiResponse.success(
      result,
      'Plans retrieved',
    );
  }

  @Get(':code')
  async getPlan(
    @Param('code') code: string,
  ): Promise<
    ApiResponse<PlanResponseDto>
  > {
    const result =
      await this.plansService.getPublicPlan(
        code,
      );

    return ApiResponse.success(
      result,
      'Plan retrieved',
    );
  }
}