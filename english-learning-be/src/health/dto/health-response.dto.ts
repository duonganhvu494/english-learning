import { ApiProperty } from '@nestjs/swagger';

export type HealthCheckStatus = 'ok' | 'failed';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
    enum: ['ok', 'failed'],
  })
  status: HealthCheckStatus;

  @ApiProperty({
    example: '2026-07-23T06:55:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    example: {
      app: 'ok',
      database: 'ok',
      redis: 'ok',
      s3Config: 'ok',
    },
  })
  checks: Record<string, HealthCheckStatus>;
}

