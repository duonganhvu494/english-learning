import { Test, TestingModule } from '@nestjs/testing';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';

describe('BillingController', () => {
  let controller: BillingController;
  let billingService: {
    getMyBillingSubscription: jest.Mock;
    startMyWorkspacePlanSubscription: jest.Mock;
    markMyTransactionPaid: jest.Mock;
    markMyTransactionFailed: jest.Mock;
    cancelMyBillingSubscription: jest.Mock;
  };

  beforeEach(async () => {
    billingService = {
      getMyBillingSubscription: jest.fn(),
      startMyWorkspacePlanSubscription: jest.fn(),
      markMyTransactionPaid: jest.fn(),
      markMyTransactionFailed: jest.fn(),
      cancelMyBillingSubscription: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        {
          provide: BillingService,
          useValue: billingService,
        },
      ],
    }).compile();

    controller = module.get<BillingController>(BillingController);
  });

  it('returns the current owner billing subscription', async () => {
    billingService.getMyBillingSubscription.mockResolvedValue({
      id: 'billing-subscription-1',
      workspace: { id: 'workspace-1' },
      plan: {
        id: 'plan-starter',
        code: 'starter',
        name: 'Starter',
        description: 'For growing English centers',
        monthlyPriceCents: 9900,
        isPublic: true,
        isActive: true,
        sortOrder: 2,
        features: [],
      },
      status: 'active',
      provider: 'mock',
      providerSubscriptionRef: 'mock-sub-1',
      billingCycle: 'monthly',
      activatedAt: new Date('2026-03-26T10:00:00.000Z'),
      currentPeriodStart: new Date('2026-03-26T10:00:00.000Z'),
      currentPeriodEnd: new Date('2026-04-26T10:00:00.000Z'),
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      endedAt: null,
    });

    const result = await controller.myBillingSubscription({
      user: { userId: 'teacher-1' },
    } as never);

    expect(billingService.getMyBillingSubscription).toHaveBeenCalledWith(
      'teacher-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Current billing subscription retrieved',
      result: expect.objectContaining({
        id: 'billing-subscription-1',
        workspaceId: 'workspace-1',
        status: 'active',
      }),
    });
  });

  it('starts a billing subscription for the current owner workspace', async () => {
    billingService.startMyWorkspacePlanSubscription.mockResolvedValue({
      billingSubscription: {
        id: 'billing-subscription-1',
        workspace: { id: 'workspace-1' },
        plan: {
          id: 'plan-starter',
          code: 'starter',
          name: 'Starter',
          description: 'For growing English centers',
          monthlyPriceCents: 9900,
          isPublic: true,
          isActive: true,
          sortOrder: 2,
          features: [],
        },
        status: 'pending_activation',
        provider: 'mock',
        providerSubscriptionRef: 'mock-sub-1',
        billingCycle: 'monthly',
        activatedAt: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        endedAt: null,
      },
      paymentTransaction: {
        id: 'payment-transaction-1',
        billingSubscription: { id: 'billing-subscription-1' },
        workspace: { id: 'workspace-1' },
        plan: { id: 'plan-starter', code: 'starter' },
        type: 'initial_charge',
        status: 'pending',
        amountCents: 9900,
        billingPeriodStart: new Date('2026-03-26T10:00:00.000Z'),
        billingPeriodEnd: new Date('2026-04-26T10:00:00.000Z'),
        provider: 'mock',
        providerTransactionRef: null,
        paidAt: null,
        failedAt: null,
        failureReason: null,
      },
    });

    const result = await controller.startMyBillingSubscription(
      { planCode: 'starter' },
      { user: { userId: 'teacher-1' } } as never,
    );

    expect(billingService.startMyWorkspacePlanSubscription).toHaveBeenCalledWith(
      'teacher-1',
      'starter',
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Billing subscription started',
      result: expect.objectContaining({
        billingSubscription: expect.objectContaining({
          id: 'billing-subscription-1',
        }),
        paymentTransaction: expect.objectContaining({
          id: 'payment-transaction-1',
        }),
      }),
    });
  });

  it('marks a mock payment transaction as paid', async () => {
    billingService.markMyTransactionPaid.mockResolvedValue({
      id: 'payment-transaction-1',
      billingSubscription: { id: 'billing-subscription-1' },
      workspace: { id: 'workspace-1' },
      plan: { id: 'plan-starter', code: 'starter' },
      type: 'initial_charge',
      status: 'paid',
      amountCents: 9900,
      billingPeriodStart: new Date('2026-03-26T10:00:00.000Z'),
      billingPeriodEnd: new Date('2026-04-26T10:00:00.000Z'),
      provider: 'mock',
      providerTransactionRef: 'mock-txn-1',
      paidAt: new Date('2026-03-26T10:00:05.000Z'),
      failedAt: null,
      failureReason: null,
    });

    const result = await controller.payMockTransaction(
      'payment-transaction-1',
      { user: { userId: 'teacher-1' } } as never,
    );

    expect(billingService.markMyTransactionPaid).toHaveBeenCalledWith(
      'teacher-1',
      'payment-transaction-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Payment transaction marked as paid',
      result: expect.objectContaining({
        id: 'payment-transaction-1',
        status: 'paid',
      }),
    });
  });

  it('marks a mock payment transaction as failed', async () => {
    billingService.markMyTransactionFailed.mockResolvedValue({
      id: 'payment-transaction-2',
      billingSubscription: { id: 'billing-subscription-1' },
      workspace: { id: 'workspace-1' },
      plan: { id: 'plan-starter', code: 'starter' },
      type: 'recurring_charge',
      status: 'failed',
      amountCents: 9900,
      billingPeriodStart: new Date('2026-04-26T10:00:00.000Z'),
      billingPeriodEnd: new Date('2026-05-26T10:00:00.000Z'),
      provider: 'mock',
      providerTransactionRef: null,
      paidAt: null,
      failedAt: new Date('2026-04-26T10:00:05.000Z'),
      failureReason: 'Card declined',
    });

    const result = await controller.failMockTransaction(
      'payment-transaction-2',
      { failureReason: 'Card declined' },
      { user: { userId: 'teacher-1' } } as never,
    );

    expect(billingService.markMyTransactionFailed).toHaveBeenCalledWith(
      'teacher-1',
      'payment-transaction-2',
      'Card declined',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Payment transaction marked as failed',
      result: expect.objectContaining({
        id: 'payment-transaction-2',
        status: 'failed',
        failureReason: 'Card declined',
      }),
    });
  });

  it('cancels the current billing subscription at period end', async () => {
    billingService.cancelMyBillingSubscription.mockResolvedValue({
      id: 'billing-subscription-1',
      workspace: { id: 'workspace-1' },
      plan: {
        id: 'plan-starter',
        code: 'starter',
        name: 'Starter',
        description: 'For growing English centers',
        monthlyPriceCents: 9900,
        isPublic: true,
        isActive: true,
        sortOrder: 2,
        features: [],
      },
      status: 'active',
      provider: 'mock',
      providerSubscriptionRef: 'mock-sub-1',
      billingCycle: 'monthly',
      activatedAt: new Date('2026-03-26T10:00:00.000Z'),
      currentPeriodStart: new Date('2026-03-26T10:00:00.000Z'),
      currentPeriodEnd: new Date('2026-04-26T10:00:00.000Z'),
      cancelAtPeriodEnd: true,
      cancelledAt: new Date('2026-03-27T09:30:00.000Z'),
      endedAt: null,
    });

    const result = await controller.cancelMyBillingSubscription({
      user: { userId: 'teacher-1' },
    } as never);

    expect(billingService.cancelMyBillingSubscription).toHaveBeenCalledWith(
      'teacher-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Billing subscription will cancel at period end',
      result: expect.objectContaining({
        id: 'billing-subscription-1',
        cancelAtPeriodEnd: true,
      }),
    });
  });
});
