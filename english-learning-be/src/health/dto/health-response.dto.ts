
export type HealthCheckStatus = 'ok' | 'failed';

export class HealthResponseDto {
  status: HealthCheckStatus;

  timestamp: string;

  checks: Record<string, HealthCheckStatus>;
}

