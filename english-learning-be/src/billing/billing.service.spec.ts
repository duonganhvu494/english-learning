import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from 'src/workspaces/entities/plan.entity';
import {
  WorkspaceSubscription,
  WorkspaceSubscriptionSource,
  WorkspaceSubscriptionStatus,
} from 'src/workspaces/entities/workspace-subscription.entity';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { BillingService } from './billing.service';
import {
  BillingCycle,
  BillingProvider,
  BillingSubscription,
  BillingSubscriptionStatus,
} from './entities/billing-subscription.entity';
import {
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from './entities/payment-transaction.entity';

describe('BillingService', () => {
  let service: BillingService;

  const billingSubscriptionRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };
  const paymentTransactionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };
  const workspaceRepo = {
    findOne: jest.fn(),
  };
  const planRepo = {
    findOne: jest.fn(),
  };
  const workspaceSubscriptionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const managerBillingSubscriptionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const managerPaymentTransactionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const managerWorkspaceSubscriptionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    billingSubscriptionRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    paymentTransactionRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    workspaceSubscriptionRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    managerBillingSubscriptionRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    managerPaymentTransactionRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    managerWorkspaceSubscriptionRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );

    managerBillingSubscriptionRepo.save.mockImplementation(
      async (input: Record<string, unknown>) => ({
        id: (input.id as string | undefined) ?? 'billing-subscription-1',
        ...input,
      }),
    );
    managerPaymentTransactionRepo.save.mockImplementation(
      async (input: Record<string, unknown>) => ({
        id: (input.id as string | undefined) ?? 'payment-transaction-1',
        ...input,
      }),
    );
    managerWorkspaceSubscriptionRepo.save.mockImplementation(
      async (input: Record<string, unknown>) => ({
        id: (input.id as string | undefined) ?? 'workspace-subscription-1',
        ...input,
      }),
    );

    const transactionManager = {
      getRepository: jest.fn((entity) => {
        if (entity === BillingSubscription) {
          return managerBillingSubscriptionRepo;
        }
        if (entity === PaymentTransaction) {
          return managerPaymentTransactionRepo;
        }
        if (entity === WorkspaceSubscription) {
          return managerWorkspaceSubscriptionRepo;
        }
        throw new Error(`Unexpected repository request: ${String(entity)}`);
      }),
    };

    billingSubscriptionRepo.manager.transaction.mockImplementation(
      async (callback: (manager: typeof transactionManager) => Promise<unknown>) =>
        callback(transactionManager),
    );
    paymentTransactionRepo.manager.transaction.mockImplementation(
      async (callback: (manager: typeof transactionManager) => Promise<unknown>) =>
        callback(transactionManager),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(BillingSubscription),
          useValue: billingSubscriptionRepo,
        },
        {
          provide: getRepositoryToken(PaymentTransaction),
          useValue: paymentTransactionRepo,
        },
        {
          provide: getRepositoryToken(Workspace),
          useValue: workspaceRepo,
        },
        {
          provide: getRepositoryToken(Plan),
          useValue: planRepo,
        },
        {
          provide: getRepositoryToken(WorkspaceSubscription),
          useValue: workspaceSubscriptionRepo,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('starts a pending billing subscription and initial charge for a paid plan', async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: 'workspace-1' });
    planRepo.findOne.mockResolvedValue({
      id: 'plan-starter',
      code: 'starter',
      monthlyPriceCents: 9900,
      isPublic: true,
      isActive: true,
    });
    billingSubscriptionRepo.findOne.mockResolvedValue(null);

    const result = await service.startWorkspacePlanSubscription(
      'workspace-1',
      'starter',
    );

    expect(result.billingSubscription).toMatchObject({
      id: 'billing-subscription-1',
      status: BillingSubscriptionStatus.PENDING_ACTIVATION,
      provider: BillingProvider.MOCK,
      billingCycle: BillingCycle.MONTHLY,
    });
    expect(result.paymentTransaction).toMatchObject({
      id: 'payment-transaction-1',
      status: PaymentTransactionStatus.PENDING,
      type: PaymentTransactionType.INITIAL_CHARGE,
      amountCents: 9900,
      provider: BillingProvider.MOCK,
    });
    expect(result.paymentTransaction.billingPeriodStart).toBeInstanceOf(Date);
    expect(result.paymentTransaction.billingPeriodEnd).toBeInstanceOf(Date);
  });

  it('activates billing and replaces the free workspace subscription when payment succeeds', async () => {
    const workspace = { id: 'workspace-1' };
    const starterPlan = { id: 'plan-starter', code: 'starter' };
    const freeSubscription = {
      id: 'workspace-sub-free',
      workspace,
      plan: { id: 'plan-free', code: 'free' },
      status: WorkspaceSubscriptionStatus.ACTIVE,
      startedAt: new Date('2026-03-01T00:00:00.000Z'),
      endedAt: new Date('2026-04-01T00:00:00.000Z'),
      source: WorkspaceSubscriptionSource.WORKSPACE_CREATION,
    };
    const paymentTransaction = {
      id: 'payment-transaction-1',
      status: PaymentTransactionStatus.PENDING,
      type: PaymentTransactionType.INITIAL_CHARGE,
      billingPeriodStart: new Date('2026-03-26T00:00:00.000Z'),
      billingPeriodEnd: new Date('2026-04-26T00:00:00.000Z'),
      providerTransactionRef: null,
      paidAt: null,
      failedAt: null,
      failureReason: null,
      workspace,
      plan: starterPlan,
      billingSubscription: {
        id: 'billing-subscription-1',
        workspace,
        plan: starterPlan,
        status: BillingSubscriptionStatus.PENDING_ACTIVATION,
        activatedAt: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
    };

    paymentTransactionRepo.findOne.mockResolvedValue(paymentTransaction);
    managerWorkspaceSubscriptionRepo.findOne.mockResolvedValue(freeSubscription);

    const result = await service.markTransactionPaid('payment-transaction-1');

    expect(result.status).toBe(PaymentTransactionStatus.PAID);
    expect(result.providerTransactionRef).toEqual(expect.any(String));
    expect(managerBillingSubscriptionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: BillingSubscriptionStatus.ACTIVE,
        currentPeriodStart: paymentTransaction.billingPeriodStart,
        currentPeriodEnd: paymentTransaction.billingPeriodEnd,
      }),
    );
    expect(managerWorkspaceSubscriptionRepo.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'workspace-sub-free',
        status: WorkspaceSubscriptionStatus.EXPIRED,
        endedAt: paymentTransaction.billingPeriodStart,
      }),
    );
    expect(managerWorkspaceSubscriptionRepo.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        workspace,
        plan: starterPlan,
        status: WorkspaceSubscriptionStatus.ACTIVE,
        startedAt: paymentTransaction.billingPeriodStart,
        endedAt: paymentTransaction.billingPeriodEnd,
        source: WorkspaceSubscriptionSource.BILLING_PAYMENT,
        paymentTransactionId: 'payment-transaction-1',
        note: 'Activated starter plan from billing payment',
      }),
    );
  });

  it('extends the current billing-driven workspace subscription on recurring payment success', async () => {
    const workspace = { id: 'workspace-1' };
    const starterPlan = { id: 'plan-starter', code: 'starter' };
    const existingPaidSubscription = {
      id: 'workspace-sub-paid',
      workspace,
      plan: starterPlan,
      status: WorkspaceSubscriptionStatus.ACTIVE,
      startedAt: new Date('2026-03-26T00:00:00.000Z'),
      endedAt: new Date('2026-04-26T00:00:00.000Z'),
      source: WorkspaceSubscriptionSource.BILLING_PAYMENT,
      paymentTransactionId: 'payment-transaction-1',
      note: 'Activated starter plan from billing payment',
    };
    const paymentTransaction = {
      id: 'payment-transaction-2',
      status: PaymentTransactionStatus.PENDING,
      type: PaymentTransactionType.RECURRING_CHARGE,
      billingPeriodStart: new Date('2026-04-26T00:00:00.000Z'),
      billingPeriodEnd: new Date('2026-05-26T00:00:00.000Z'),
      providerTransactionRef: null,
      paidAt: null,
      failedAt: null,
      failureReason: null,
      workspace,
      plan: starterPlan,
      billingSubscription: {
        id: 'billing-subscription-1',
        workspace,
        plan: starterPlan,
        status: BillingSubscriptionStatus.ACTIVE,
        activatedAt: new Date('2026-03-26T00:00:00.000Z'),
        currentPeriodStart: new Date('2026-03-26T00:00:00.000Z'),
        currentPeriodEnd: new Date('2026-04-26T00:00:00.000Z'),
      },
    };

    paymentTransactionRepo.findOne.mockResolvedValue(paymentTransaction);
    managerWorkspaceSubscriptionRepo.findOne.mockResolvedValue(
      existingPaidSubscription,
    );

    await service.markTransactionPaid('payment-transaction-2');

    expect(managerWorkspaceSubscriptionRepo.create).not.toHaveBeenCalled();
    expect(managerWorkspaceSubscriptionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'workspace-sub-paid',
        endedAt: paymentTransaction.billingPeriodEnd,
        paymentTransactionId: 'payment-transaction-2',
        note: 'Renewed starter plan from billing payment',
      }),
    );
  });

  it('expires the pending billing subscription when the initial charge fails', async () => {
    const billingSubscription = {
      id: 'billing-subscription-1',
      status: BillingSubscriptionStatus.PENDING_ACTIVATION,
      activatedAt: null,
      endedAt: null,
    };
    const paymentTransaction = {
      id: 'payment-transaction-1',
      status: PaymentTransactionStatus.PENDING,
      type: PaymentTransactionType.INITIAL_CHARGE,
      paidAt: null,
      failedAt: null,
      failureReason: null,
      billingSubscription,
    };

    paymentTransactionRepo.findOne.mockResolvedValue(paymentTransaction);

    const result = await service.markTransactionFailed(
      'payment-transaction-1',
      'Card declined',
    );

    expect(result.status).toBe(PaymentTransactionStatus.FAILED);
    expect(result.failureReason).toBe('Card declined');
    expect(managerBillingSubscriptionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'billing-subscription-1',
        status: BillingSubscriptionStatus.EXPIRED,
        endedAt: expect.any(Date),
      }),
    );
  });

  it('moves an active billing subscription to past due when a recurring charge fails', async () => {
    const billingSubscription = {
      id: 'billing-subscription-1',
      status: BillingSubscriptionStatus.ACTIVE,
      activatedAt: new Date('2026-03-26T00:00:00.000Z'),
      endedAt: null,
    };
    const paymentTransaction = {
      id: 'payment-transaction-2',
      status: PaymentTransactionStatus.PENDING,
      type: PaymentTransactionType.RECURRING_CHARGE,
      paidAt: null,
      failedAt: null,
      failureReason: null,
      billingSubscription,
    };

    paymentTransactionRepo.findOne.mockResolvedValue(paymentTransaction);

    const result = await service.markTransactionFailed(
      'payment-transaction-2',
      'Card declined',
    );

    expect(result.status).toBe(PaymentTransactionStatus.FAILED);
    expect(result.failureReason).toBe('Card declined');
    expect(managerBillingSubscriptionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'billing-subscription-1',
        status: BillingSubscriptionStatus.PAST_DUE,
        endedAt: null,
      }),
    );
  });

  it('creates the next monthly renewal transaction', async () => {
    const billingSubscription = {
      id: 'billing-subscription-1',
      status: BillingSubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: false,
      currentPeriodStart: new Date('2026-03-26T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-04-26T00:00:00.000Z'),
      workspace: { id: 'workspace-1' },
      plan: {
        id: 'plan-starter',
        code: 'starter',
        monthlyPriceCents: 9900,
      },
    };
    billingSubscriptionRepo.findOne.mockResolvedValue(billingSubscription);
    paymentTransactionRepo.findOne.mockResolvedValue(null);
    paymentTransactionRepo.save.mockImplementation(async (input) => ({
      id: 'payment-transaction-2',
      ...input,
    }));

    const result = await service.createRenewalTransaction(
      'billing-subscription-1',
    );

    expect(result).toMatchObject({
      id: 'payment-transaction-2',
      type: PaymentTransactionType.RECURRING_CHARGE,
      status: PaymentTransactionStatus.PENDING,
      amountCents: 9900,
    });
    expect(result.billingPeriodStart).toEqual(
      new Date('2026-04-26T00:00:00.000Z'),
    );
    expect(result.billingPeriodEnd).toEqual(
      new Date('2026-05-26T00:00:00.000Z'),
    );
  });

  it('processes due mock renewals by creating and paying the next transaction', async () => {
    billingSubscriptionRepo.find.mockResolvedValue([
      {
        id: 'billing-subscription-1',
        provider: BillingProvider.MOCK,
        status: BillingSubscriptionStatus.ACTIVE,
        endedAt: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date('2026-04-26T00:00:00.000Z'),
        workspace: { id: 'workspace-1' },
        plan: {
          id: 'plan-starter',
          code: 'starter',
          monthlyPriceCents: 9900,
        },
      },
    ]);
    paymentTransactionRepo.findOne.mockResolvedValue(null);

    const createRenewalTransactionSpy = jest
      .spyOn(service, 'createRenewalTransaction')
      .mockResolvedValue({
        id: 'payment-transaction-2',
      } as PaymentTransaction);
    const markTransactionPaidSpy = jest
      .spyOn(service, 'markTransactionPaid')
      .mockResolvedValue({
        id: 'payment-transaction-2',
      } as PaymentTransaction);

    const result = await service.processDueMockRecurringRenewals(
      new Date('2026-04-26T00:00:00.000Z'),
    );

    expect(result).toBe(1);
    expect(createRenewalTransactionSpy).toHaveBeenCalledWith(
      'billing-subscription-1',
    );
    expect(markTransactionPaidSpy).toHaveBeenCalledWith(
      'payment-transaction-2',
    );
  });

  it('processes due mock renewals by paying an existing pending renewal transaction', async () => {
    billingSubscriptionRepo.find.mockResolvedValue([
      {
        id: 'billing-subscription-1',
        provider: BillingProvider.MOCK,
        status: BillingSubscriptionStatus.ACTIVE,
        endedAt: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date('2026-04-26T00:00:00.000Z'),
        workspace: { id: 'workspace-1' },
        plan: {
          id: 'plan-starter',
          code: 'starter',
          monthlyPriceCents: 9900,
        },
      },
    ]);
    paymentTransactionRepo.findOne.mockResolvedValue({
      id: 'payment-transaction-2',
      status: PaymentTransactionStatus.PENDING,
    });

    const createRenewalTransactionSpy = jest.spyOn(
      service,
      'createRenewalTransaction',
    );
    const markTransactionPaidSpy = jest
      .spyOn(service, 'markTransactionPaid')
      .mockResolvedValue({
        id: 'payment-transaction-2',
      } as PaymentTransaction);

    const result = await service.processDueMockRecurringRenewals(
      new Date('2026-04-26T00:00:00.000Z'),
    );

    expect(result).toBe(1);
    expect(createRenewalTransactionSpy).not.toHaveBeenCalled();
    expect(markTransactionPaidSpy).toHaveBeenCalledWith(
      'payment-transaction-2',
    );
  });

  it('finalizes cancelled subscriptions after the billing period ends', async () => {
    const freePlan = {
      id: 'plan-free',
      code: 'free',
      name: 'Free',
      monthlyPriceCents: 0,
      isPublic: true,
      isActive: true,
    };
    const subscription = {
      id: 'billing-subscription-1',
      workspace: { id: 'workspace-1' },
      status: BillingSubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date('2026-04-26T00:00:00.000Z'),
      endedAt: null,
    };
    const workspaceSubscription = {
      id: 'workspace-subscription-1',
      workspace: { id: 'workspace-1' },
      status: WorkspaceSubscriptionStatus.ACTIVE,
      source: WorkspaceSubscriptionSource.BILLING_PAYMENT,
      endedAt: new Date('2026-04-26T00:00:00.000Z'),
    };

    billingSubscriptionRepo.find.mockResolvedValue([subscription]);
    planRepo.findOne.mockResolvedValue(freePlan);
    managerWorkspaceSubscriptionRepo.findOne.mockResolvedValue(
      workspaceSubscription,
    );

    const result = await service.finalizeEndedSubscriptions(
      new Date('2026-04-26T00:00:00.000Z'),
    );

    expect(result).toBe(1);
    expect(managerBillingSubscriptionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'billing-subscription-1',
        status: BillingSubscriptionStatus.CANCELLED,
        endedAt: new Date('2026-04-26T00:00:00.000Z'),
      }),
    );
    expect(managerWorkspaceSubscriptionRepo.save).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'workspace-subscription-1',
        status: WorkspaceSubscriptionStatus.EXPIRED,
        endedAt: new Date('2026-04-26T00:00:00.000Z'),
      }),
    );
    expect(managerWorkspaceSubscriptionRepo.save).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        workspace: { id: 'workspace-1' },
        plan: freePlan,
        status: WorkspaceSubscriptionStatus.ACTIVE,
        startedAt: new Date('2026-04-26T00:00:00.000Z'),
        endedAt: null,
        source: WorkspaceSubscriptionSource.BILLING_FALLBACK,
        paymentTransactionId: null,
        note: 'Reverted to free plan after paid subscription ended',
      }),
    );
  });

  it('rejects creating a billing subscription for a free plan', async () => {
    workspaceRepo.findOne.mockResolvedValue({ id: 'workspace-1' });
    planRepo.findOne.mockResolvedValue({
      id: 'plan-free',
      code: 'free',
      monthlyPriceCents: 0,
      isPublic: true,
      isActive: true,
    });
    billingSubscriptionRepo.findOne.mockResolvedValue(null);

    await expect(
      service.startWorkspacePlanSubscription('workspace-1', 'free'),
    ).rejects.toThrow(
      new BadRequestException('Selected plan is not billable'),
    );
  });
});
