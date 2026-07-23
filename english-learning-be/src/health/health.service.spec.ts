import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { RedisService } from 'src/rbac/redis/redis.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let dataSource: { query: jest.Mock };
  let redisService: { withClient: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    dataSource = {
      query: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };
    redisService = {
      withClient: jest.fn().mockResolvedValue('PONG'),
    };
    configService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const values: Record<string, string> = {
          'storage.s3.bucket': 'bucket',
          'storage.s3.accessKeyId': 'access-key',
          'storage.s3.secretAccessKey': 'secret-key',
        };

        return values[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: DataSource,
          useValue: dataSource,
        },
        {
          provide: RedisService,
          useValue: redisService,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get(HealthService);
  });

  it('returns liveness status without checking external dependencies', () => {
    const result = service.checkHealth();

    expect(result.status).toBe('ok');
    expect(result.checks).toEqual({ app: 'ok' });
    expect(dataSource.query).not.toHaveBeenCalled();
    expect(redisService.withClient).not.toHaveBeenCalled();
  });

  it('returns readiness status when dependencies are available', async () => {
    const result = await service.checkReadiness();

    expect(result.status).toBe('ok');
    expect(result.checks).toEqual({
      database: 'ok',
      redis: 'ok',
      s3Config: 'ok',
    });
    expect(dataSource.query).toHaveBeenCalledWith('SELECT 1');
    expect(redisService.withClient).toHaveBeenCalledTimes(1);
  });

  it('throws service unavailable when database is not ready', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('database down'));

    await expect(service.checkReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws service unavailable when redis is not ready', async () => {
    redisService.withClient.mockResolvedValueOnce('NOPE');

    await expect(service.checkReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws service unavailable when S3 config is incomplete', async () => {
    configService.get.mockImplementation((key: string, defaultValue?: string) =>
      key === 'storage.s3.bucket' ? '' : defaultValue,
    );

    await expect(service.checkReadiness()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

