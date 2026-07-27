import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  getHealth(): ApiResponse<HealthResponseDto> {
    return ApiResponse.success(
      this.healthService.checkHealth(),
      'Health check passed',
    );
  }

  @Get('ready')
  async getReadiness(): Promise<ApiResponse<HealthResponseDto>> {
    return ApiResponse.success(
      await this.healthService.checkReadiness(),
      'Readiness check passed',
    );
  }
}
