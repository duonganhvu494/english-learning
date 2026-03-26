import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../billing.service';
import { BillingRecurringJob } from './billing-recurring.job';

describe('BillingRecurringJob', () => {
  let job: BillingRecurringJob;
  const billingService = {
    processDueMockRecurringRenewals: jest.fn(),
    finalizeEndedSubscriptions: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingRecurringJob,
        {
          provide: BillingService,
          useValue: billingService,
        },
      ],
    }).compile();

    job = module.get<BillingRecurringJob>(BillingRecurringJob);
  });

  it('processes renewals and finalized subscriptions on each cron run', async () => {
    billingService.processDueMockRecurringRenewals.mockResolvedValue(2);
    billingService.finalizeEndedSubscriptions.mockResolvedValue(1);

    await job.handleRecurringBillingLifecycle();

    expect(
      billingService.processDueMockRecurringRenewals,
    ).toHaveBeenCalledTimes(1);
    expect(billingService.finalizeEndedSubscriptions).toHaveBeenCalledTimes(1);
  });
});
