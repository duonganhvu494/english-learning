import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { HealthResponseDto } from './dto/health-response.dto';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check whether the application process is alive' })
  @ApiEnvelopeResponse({
    model: HealthResponseDto,
    description: 'Application process is alive',
    exampleMessage: 'Health check passed',
  })
  getHealth(): ApiResponse<HealthResponseDto> {
    return ApiResponse.success(
      this.healthService.checkHealth(),
      'Health check passed',
    );
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Check whether the application is ready to receive traffic',
  })
  @ApiEnvelopeResponse({
    model: HealthResponseDto,
    description: 'Application dependencies are ready',
    exampleMessage: 'Readiness check passed',
  })
  async getReadiness(): Promise<ApiResponse<HealthResponseDto>> {
    return ApiResponse.success(
      await this.healthService.checkReadiness(),
      'Readiness check passed',
    );
  }
}
