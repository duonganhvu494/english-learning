import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { RedisService } from 'src/rbac/redis/redis.service';
import {
  HealthCheckStatus,
  HealthResponseDto,
} from './dto/health-response.dto';

@Injectable()
export class HealthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {}

  checkHealth(): HealthResponseDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        app: 'ok',
      },
    };
  }

  async checkReadiness(): Promise<HealthResponseDto> {
    const checks: Record<string, HealthCheckStatus> = {
      database: 'failed',
      redis: 'failed',
      s3Config: 'failed',
    };

    if (await this.isDatabaseReady()) {
      checks.database = 'ok';
    }

    if (await this.isRedisReady()) {
      checks.redis = 'ok';
    }

    if (this.hasRequiredS3Config()) {
      checks.s3Config = 'ok';
    }

    if (Object.values(checks).some((status) => status === 'failed')) {
      throw new ServiceUnavailableException(
        errorPayload('Readiness check failed', 'HEALTH_READINESS_FAILED'),
      );
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks,
    };
  }

  private async isDatabaseReady(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async isRedisReady(): Promise<boolean> {
    try {
      const pong = await this.redisService.withClient((client) =>
        client.ping(),
      );
      return pong === 'PONG';
    } catch {
      return false;
    }
  }

  private hasRequiredS3Config(): boolean {
    return [
      this.config.get<string>('storage.s3.bucket', ''),
      this.config.get<string>('storage.s3.accessKeyId', ''),
      this.config.get<string>('storage.s3.secretAccessKey', ''),
    ].every((value) => value.trim().length > 0);
  }
}

