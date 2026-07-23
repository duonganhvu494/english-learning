import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: {
    checkHealth: jest.Mock;
    checkReadiness: jest.Mock;
  };

  beforeEach(async () => {
    healthService = {
      checkHealth: jest.fn().mockReturnValue({
        status: 'ok',
        timestamp: '2026-07-23T00:00:00.000Z',
        checks: { app: 'ok' },
      }),
      checkReadiness: jest.fn().mockResolvedValue({
        status: 'ok',
        timestamp: '2026-07-23T00:00:00.000Z',
        checks: {
          database: 'ok',
          redis: 'ok',
          s3Config: 'ok',
        },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
      ],
    }).compile();

    controller = module.get(HealthController);
  });

  it('wraps the liveness response', () => {
    const response = controller.getHealth();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe('Health check passed');
    expect(response.result.checks).toEqual({ app: 'ok' });
  });

  it('wraps the readiness response', async () => {
    const response = await controller.getReadiness();

    expect(response.statusCode).toBe(200);
    expect(response.message).toBe('Readiness check passed');
    expect(response.result.checks).toEqual({
      database: 'ok',
      redis: 'ok',
      s3Config: 'ok',
    });
  });
});

