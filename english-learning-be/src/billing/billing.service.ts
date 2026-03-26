import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { Workspace } from 'src/workspaces/entities/workspace.entity';
import { Plan } from 'src/workspaces/entities/plan.entity';
import {
  WorkspaceSubscription,
  WorkspaceSubscriptionSource,
  WorkspaceSubscriptionStatus,
} from 'src/workspaces/entities/workspace-subscription.entity';
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

@Injectable()
export class BillingService {
  private readonly defaultWorkspacePlanCode = 'free';

  constructor(
    @InjectRepository(BillingSubscription)
    private readonly billingSubscriptionRepo: Repository<BillingSubscription>,

    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepo: Repository<PaymentTransaction>,

    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,

    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,

    @InjectRepository(WorkspaceSubscription)
    private readonly workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
  ) {}

  async getCurrentBillingSubscription(
    workspaceId: string,
  ): Promise<BillingSubscription | null> {
    return this.billingSubscriptionRepo.findOne({
      where: {
        workspace: { id: workspaceId },
        endedAt: IsNull(),
      },
      relations: {
        workspace: true,
        plan: {
          features: true,
        },
      },
    });
  }

  async getMyBillingSubscription(
    userId: string,
  ): Promise<BillingSubscription | null> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);
    return this.billingSubscriptionRepo.findOne({
      where: {
        workspace: { id: workspace.id },
        endedAt: IsNull(),
      },
      relations: {
        workspace: true,
        plan: {
          features: true,
        },
      },
    });
  }

  async startMyWorkspacePlanSubscription(
    userId: string,
    planCode: string,
  ): Promise<{
    billingSubscription: BillingSubscription;
    paymentTransaction: PaymentTransaction;
  }> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);
    return this.startWorkspacePlanSubscription(workspace.id, planCode);
  }

  async markMyTransactionPaid(
    userId: string,
    transactionId: string,
  ): Promise<PaymentTransaction> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);
    await this.getWorkspaceTransactionOrThrow(workspace.id, transactionId);
    return this.markTransactionPaid(transactionId);
  }

  async markMyTransactionFailed(
    userId: string,
    transactionId: string,
    failureReason?: string,
  ): Promise<PaymentTransaction> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);
    await this.getWorkspaceTransactionOrThrow(workspace.id, transactionId);
    return this.markTransactionFailed(transactionId, failureReason);
  }

  async cancelMyBillingSubscription(
    userId: string,
  ): Promise<BillingSubscription> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);
    const billingSubscription = await this.getCurrentBillingSubscription(
      workspace.id,
    );

    if (!billingSubscription) {
      throw new BadRequestException(
        errorPayload(
          'Billing subscription not found',
          'BILLING_SUBSCRIPTION_NOT_FOUND',
        ),
      );
    }

    return this.cancelSubscriptionAtPeriodEnd(billingSubscription.id);
  }

  async startWorkspacePlanSubscription(
    workspaceId: string,
    planCode: string,
  ): Promise<{
    billingSubscription: BillingSubscription;
    paymentTransaction: PaymentTransaction;
  }> {
    const normalizedPlanCode = planCode.trim().toLowerCase();
    const [workspace, plan, existingSubscription] = await Promise.all([
      this.workspaceRepo.findOne({
        where: { id: workspaceId },
      }),
      this.planRepo.findOne({
        where: {
          code: normalizedPlanCode,
          isPublic: true,
          isActive: true,
        },
        relations: {
          features: true,
        },
      }),
      this.billingSubscriptionRepo.findOne({
        where: {
          workspace: { id: workspaceId },
          endedAt: IsNull(),
        },
        relations: {
          workspace: true,
          plan: true,
        },
      }),
    ]);

    if (!workspace) {
      throw new BadRequestException(
        errorPayload('Workspace not found', 'WORKSPACE_NOT_FOUND'),
      );
    }

    if (!plan) {
      throw new BadRequestException(
        errorPayload('Billing plan not found', 'BILLING_PLAN_NOT_FOUND'),
      );
    }

    if (!Number.isFinite(plan.monthlyPriceCents) || (plan.monthlyPriceCents ?? 0) <= 0) {
      throw new BadRequestException(
        errorPayload(
          'Selected plan is not billable',
          'BILLING_PLAN_NOT_BILLABLE',
        ),
      );
    }

    if (existingSubscription) {
      throw new BadRequestException(
        errorPayload(
          'Workspace already has an active billing subscription',
          'BILLING_SUBSCRIPTION_ALREADY_EXISTS',
        ),
      );
    }

    const billingPeriodStart = new Date();
    const billingPeriodEnd = this.addMonths(billingPeriodStart, 1);

    return this.billingSubscriptionRepo.manager.transaction(async (manager) => {
      const billingSubscriptionRepo = manager.getRepository(BillingSubscription);
      const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

      const billingSubscription = await billingSubscriptionRepo.save(
        billingSubscriptionRepo.create({
          workspace,
          plan,
          status: BillingSubscriptionStatus.PENDING_ACTIVATION,
          provider: BillingProvider.MOCK,
          providerSubscriptionRef: this.generateMockSubscriptionRef(),
          billingCycle: BillingCycle.MONTHLY,
          activatedAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          cancelledAt: null,
          endedAt: null,
        }),
      );

      const paymentTransaction = await paymentTransactionRepo.save(
        paymentTransactionRepo.create({
          billingSubscription,
          workspace,
          plan,
          type: PaymentTransactionType.INITIAL_CHARGE,
          status: PaymentTransactionStatus.PENDING,
          amountCents: plan.monthlyPriceCents ?? 0,
          billingPeriodStart,
          billingPeriodEnd,
          provider: BillingProvider.MOCK,
          providerTransactionRef: null,
          paidAt: null,
          failedAt: null,
          failureReason: null,
        }),
      );

      return { billingSubscription, paymentTransaction };
    });
  }

  async markTransactionPaid(
    transactionId: string,
  ): Promise<PaymentTransaction> {
    const paymentTransaction = await this.paymentTransactionRepo.findOne({
      where: { id: transactionId },
      relations: {
        billingSubscription: {
          workspace: true,
          plan: true,
        },
        workspace: true,
        plan: true,
      },
    });

    if (!paymentTransaction) {
      throw new BadRequestException(
        errorPayload(
          'Payment transaction not found',
          'BILLING_TRANSACTION_NOT_FOUND',
        ),
      );
    }

    if (paymentTransaction.status !== PaymentTransactionStatus.PENDING) {
      throw new BadRequestException(
        errorPayload(
          'Only pending transactions can be marked as paid',
          'BILLING_TRANSACTION_STATUS_INVALID',
        ),
      );
    }

    const paidAt = new Date();

    return this.paymentTransactionRepo.manager.transaction(async (manager) => {
      const paymentTransactionRepo = manager.getRepository(PaymentTransaction);
      const billingSubscriptionRepo = manager.getRepository(BillingSubscription);
      const workspaceSubscriptionRepo =
        manager.getRepository(WorkspaceSubscription);

      paymentTransaction.status = PaymentTransactionStatus.PAID;
      paymentTransaction.paidAt = paidAt;
      paymentTransaction.providerTransactionRef =
        paymentTransaction.providerTransactionRef ??
        this.generateMockTransactionRef();
      paymentTransaction.failedAt = null;
      paymentTransaction.failureReason = null;
      const savedTransaction = await paymentTransactionRepo.save(
        paymentTransaction,
      );

      const billingSubscription = paymentTransaction.billingSubscription;
      billingSubscription.status = BillingSubscriptionStatus.ACTIVE;
      billingSubscription.activatedAt =
        billingSubscription.activatedAt ?? savedTransaction.paidAt;
      billingSubscription.currentPeriodStart =
        savedTransaction.billingPeriodStart;
      billingSubscription.currentPeriodEnd = savedTransaction.billingPeriodEnd;
      await billingSubscriptionRepo.save(billingSubscription);

      const activeWorkspaceSubscription = await workspaceSubscriptionRepo.findOne({
        where: [
          {
            workspace: { id: billingSubscription.workspace.id },
            status: In([
              WorkspaceSubscriptionStatus.ACTIVE,
              WorkspaceSubscriptionStatus.TRIALING,
            ]),
            endedAt: IsNull(),
          },
          {
            workspace: { id: billingSubscription.workspace.id },
            status: In([
              WorkspaceSubscriptionStatus.ACTIVE,
              WorkspaceSubscriptionStatus.TRIALING,
            ]),
            endedAt: MoreThan(savedTransaction.billingPeriodStart),
          },
        ],
        relations: {
          workspace: true,
          plan: true,
        },
        order: {
          endedAt: 'DESC',
        },
      });

      if (
        activeWorkspaceSubscription &&
        activeWorkspaceSubscription.source ===
          WorkspaceSubscriptionSource.BILLING_PAYMENT &&
        activeWorkspaceSubscription.plan.id === billingSubscription.plan.id
      ) {
        activeWorkspaceSubscription.status = WorkspaceSubscriptionStatus.ACTIVE;
        activeWorkspaceSubscription.endedAt = savedTransaction.billingPeriodEnd;
        activeWorkspaceSubscription.paymentTransactionId = savedTransaction.id;
        activeWorkspaceSubscription.note = this.buildWorkspaceSubscriptionNote(
          savedTransaction,
        );
        await workspaceSubscriptionRepo.save(activeWorkspaceSubscription);
      } else {
        if (activeWorkspaceSubscription) {
          activeWorkspaceSubscription.status =
            WorkspaceSubscriptionStatus.EXPIRED;
          activeWorkspaceSubscription.endedAt =
            savedTransaction.billingPeriodStart;
          await workspaceSubscriptionRepo.save(activeWorkspaceSubscription);
        }

        await workspaceSubscriptionRepo.save(
          workspaceSubscriptionRepo.create({
            workspace: billingSubscription.workspace,
            plan: billingSubscription.plan,
            status: WorkspaceSubscriptionStatus.ACTIVE,
            startedAt: savedTransaction.billingPeriodStart,
            endedAt: savedTransaction.billingPeriodEnd,
            trialEndsAt: null,
            cancelledAt: null,
            source: WorkspaceSubscriptionSource.BILLING_PAYMENT,
            paymentTransactionId: savedTransaction.id,
            note: this.buildWorkspaceSubscriptionNote(savedTransaction),
          }),
        );
      }

      return savedTransaction;
    });
  }

  async markTransactionFailed(
    transactionId: string,
    failureReason = 'Mock payment failed',
  ): Promise<PaymentTransaction> {
    const paymentTransaction = await this.paymentTransactionRepo.findOne({
      where: { id: transactionId },
      relations: {
        billingSubscription: true,
        workspace: true,
        plan: true,
      },
    });

    if (!paymentTransaction) {
      throw new BadRequestException(
        errorPayload(
          'Payment transaction not found',
          'BILLING_TRANSACTION_NOT_FOUND',
        ),
      );
    }

    if (paymentTransaction.status !== PaymentTransactionStatus.PENDING) {
      throw new BadRequestException(
        errorPayload(
          'Only pending transactions can be marked as failed',
          'BILLING_TRANSACTION_STATUS_INVALID',
        ),
      );
    }

    const failedAt = new Date();

    return this.paymentTransactionRepo.manager.transaction(async (manager) => {
      const paymentTransactionRepo = manager.getRepository(PaymentTransaction);
      const billingSubscriptionRepo = manager.getRepository(BillingSubscription);

      paymentTransaction.status = PaymentTransactionStatus.FAILED;
      paymentTransaction.failedAt = failedAt;
      paymentTransaction.failureReason = failureReason;
      paymentTransaction.paidAt = null;
      const savedTransaction = await paymentTransactionRepo.save(
        paymentTransaction,
      );

      if (
        paymentTransaction.type === PaymentTransactionType.INITIAL_CHARGE &&
        paymentTransaction.billingSubscription.status ===
          BillingSubscriptionStatus.PENDING_ACTIVATION &&
        !paymentTransaction.billingSubscription.activatedAt
      ) {
        paymentTransaction.billingSubscription.status =
          BillingSubscriptionStatus.EXPIRED;
        paymentTransaction.billingSubscription.endedAt = failedAt;
      } else {
        paymentTransaction.billingSubscription.status =
          BillingSubscriptionStatus.PAST_DUE;
      }
      await billingSubscriptionRepo.save(paymentTransaction.billingSubscription);

      return savedTransaction;
    });
  }

  async createRenewalTransaction(
    billingSubscriptionId: string,
  ): Promise<PaymentTransaction> {
    const billingSubscription = await this.billingSubscriptionRepo.findOne({
      where: {
        id: billingSubscriptionId,
      },
      relations: {
        workspace: true,
        plan: true,
      },
    });

    if (!billingSubscription) {
      throw new BadRequestException(
        errorPayload(
          'Billing subscription not found',
          'BILLING_SUBSCRIPTION_NOT_FOUND',
        ),
      );
    }

    if (
      billingSubscription.status !== BillingSubscriptionStatus.ACTIVE &&
      billingSubscription.status !== BillingSubscriptionStatus.PAST_DUE
    ) {
      throw new BadRequestException(
        errorPayload(
          'Billing subscription is not eligible for renewal',
          'BILLING_SUBSCRIPTION_STATUS_INVALID',
        ),
      );
    }

    if (billingSubscription.cancelAtPeriodEnd) {
      throw new BadRequestException(
        errorPayload(
          'Billing subscription is set to cancel at period end',
          'BILLING_SUBSCRIPTION_CANCELLING',
        ),
      );
    }

    if (
      !billingSubscription.currentPeriodStart ||
      !billingSubscription.currentPeriodEnd
    ) {
      throw new BadRequestException(
        errorPayload(
          'Billing subscription does not have an active billing period',
          'BILLING_SUBSCRIPTION_PERIOD_MISSING',
        ),
      );
    }

    const billingPeriodStart = billingSubscription.currentPeriodEnd;
    const billingPeriodEnd = this.addMonths(billingPeriodStart, 1);

    const existingTransaction = await this.paymentTransactionRepo.findOne({
      where: {
        billingSubscription: { id: billingSubscription.id },
        billingPeriodStart,
        billingPeriodEnd,
        type: PaymentTransactionType.RECURRING_CHARGE,
      },
    });
    if (existingTransaction) {
      throw new BadRequestException(
        errorPayload(
          'A renewal transaction already exists for this billing period',
          'BILLING_RENEWAL_TRANSACTION_EXISTS',
        ),
      );
    }

    return this.paymentTransactionRepo.save(
      this.paymentTransactionRepo.create({
        billingSubscription,
        workspace: billingSubscription.workspace,
        plan: billingSubscription.plan,
        type: PaymentTransactionType.RECURRING_CHARGE,
        status: PaymentTransactionStatus.PENDING,
        amountCents: billingSubscription.plan.monthlyPriceCents ?? 0,
        billingPeriodStart,
        billingPeriodEnd,
        provider: BillingProvider.MOCK,
        providerTransactionRef: null,
        paidAt: null,
        failedAt: null,
        failureReason: null,
      }),
    );
  }

  async processDueMockRecurringRenewals(at = new Date()): Promise<number> {
    const dueSubscriptions = await this.billingSubscriptionRepo.find({
      where: {
        provider: BillingProvider.MOCK,
        status: BillingSubscriptionStatus.ACTIVE,
        endedAt: IsNull(),
        cancelAtPeriodEnd: false,
        currentPeriodEnd: LessThanOrEqual(at),
      },
      relations: {
        workspace: true,
        plan: true,
      },
    });

    let processedCount = 0;

    for (const billingSubscription of dueSubscriptions) {
      if (!billingSubscription.currentPeriodEnd) {
        continue;
      }

      const renewalPeriodStart = billingSubscription.currentPeriodEnd;
      const renewalPeriodEnd = this.addMonths(renewalPeriodStart, 1);

      const existingTransaction = await this.paymentTransactionRepo.findOne({
        where: {
          billingSubscription: { id: billingSubscription.id },
          billingPeriodStart: renewalPeriodStart,
          billingPeriodEnd: renewalPeriodEnd,
          type: PaymentTransactionType.RECURRING_CHARGE,
        },
      });

      if (existingTransaction) {
        if (existingTransaction.status === PaymentTransactionStatus.PENDING) {
          await this.markTransactionPaid(existingTransaction.id);
          processedCount += 1;
        }

        continue;
      }

      const renewalTransaction = await this.createRenewalTransaction(
        billingSubscription.id,
      );
      await this.markTransactionPaid(renewalTransaction.id);
      processedCount += 1;
    }

    return processedCount;
  }

  async cancelSubscriptionAtPeriodEnd(
    billingSubscriptionId: string,
  ): Promise<BillingSubscription> {
    const billingSubscription = await this.billingSubscriptionRepo.findOne({
      where: {
        id: billingSubscriptionId,
        endedAt: IsNull(),
      },
      relations: {
        workspace: true,
        plan: {
          features: true,
        },
      },
    });

    if (!billingSubscription) {
      throw new BadRequestException(
        errorPayload(
          'Billing subscription not found',
          'BILLING_SUBSCRIPTION_NOT_FOUND',
        ),
      );
    }

    if (
      billingSubscription.status !== BillingSubscriptionStatus.ACTIVE &&
      billingSubscription.status !== BillingSubscriptionStatus.PAST_DUE
    ) {
      throw new BadRequestException(
        errorPayload(
          'Only active billing subscriptions can be cancelled at period end',
          'BILLING_SUBSCRIPTION_STATUS_INVALID',
        ),
      );
    }

    billingSubscription.cancelAtPeriodEnd = true;
    billingSubscription.cancelledAt = new Date();
    return this.billingSubscriptionRepo.save(billingSubscription);
  }

  async finalizeEndedSubscriptions(at = new Date()): Promise<number> {
    const subscriptions = await this.billingSubscriptionRepo.find({
      where: {
        endedAt: IsNull(),
      },
      relations: {
        workspace: true,
      },
    });

    let finalizedCount = 0;
    for (const subscription of subscriptions) {
      if (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > at) {
        continue;
      }

      const periodEnd = subscription.currentPeriodEnd;

      const shouldFinalize =
        subscription.cancelAtPeriodEnd ||
        subscription.status === BillingSubscriptionStatus.PAST_DUE;

      if (!shouldFinalize) {
        continue;
      }

      const freePlan = await this.planRepo.findOne({
        where: {
          code: this.defaultWorkspacePlanCode,
          isPublic: true,
          isActive: true,
        },
      });

      if (!freePlan) {
        throw new BadRequestException(
          errorPayload(
            'Default workspace plan not found',
            'WORKSPACE_DEFAULT_PLAN_NOT_FOUND',
          ),
        );
      }

      await this.billingSubscriptionRepo.manager.transaction(async (manager) => {
        const billingSubscriptionRepo = manager.getRepository(BillingSubscription);
        const workspaceSubscriptionRepo =
          manager.getRepository(WorkspaceSubscription);

        subscription.endedAt = periodEnd;
        subscription.status = subscription.cancelAtPeriodEnd
          ? BillingSubscriptionStatus.CANCELLED
          : BillingSubscriptionStatus.EXPIRED;
        await billingSubscriptionRepo.save(subscription);

        const workspaceSubscription = await workspaceSubscriptionRepo.findOne({
          where: {
            workspace: { id: subscription.workspace.id },
            status: In([
              WorkspaceSubscriptionStatus.ACTIVE,
              WorkspaceSubscriptionStatus.TRIALING,
            ]),
            source: WorkspaceSubscriptionSource.BILLING_PAYMENT,
          },
          order: {
            endedAt: 'DESC',
          },
        });

        if (workspaceSubscription) {
          workspaceSubscription.status = WorkspaceSubscriptionStatus.EXPIRED;
          workspaceSubscription.endedAt = periodEnd;
          await workspaceSubscriptionRepo.save(workspaceSubscription);
        }

        await workspaceSubscriptionRepo.save(
          workspaceSubscriptionRepo.create({
            workspace: subscription.workspace,
            plan: freePlan,
            status: WorkspaceSubscriptionStatus.ACTIVE,
            startedAt: periodEnd,
            endedAt: null,
            trialEndsAt: null,
            cancelledAt: null,
            source: WorkspaceSubscriptionSource.BILLING_FALLBACK,
            paymentTransactionId: null,
            note: 'Reverted to free plan after paid subscription ended',
          }),
        );
      });

      finalizedCount += 1;
    }

    return finalizedCount;
  }

  private addMonths(date: Date, months: number): Date {
    const nextDate = new Date(date);
    nextDate.setMonth(nextDate.getMonth() + months);
    return nextDate;
  }

  private generateMockSubscriptionRef(): string {
    return `mock-sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private generateMockTransactionRef(): string {
    return `mock-txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private buildWorkspaceSubscriptionNote(
    paymentTransaction: PaymentTransaction,
  ): string {
    if (paymentTransaction.type === PaymentTransactionType.RECURRING_CHARGE) {
      return `Renewed ${paymentTransaction.plan.code} plan from billing payment`;
    }

    return `Activated ${paymentTransaction.plan.code} plan from billing payment`;
  }

  private async getOwnedWorkspaceOrThrow(userId: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({
      where: {
        owner: { id: userId },
      },
    });

    if (!workspace) {
      throw new BadRequestException(
        errorPayload(
          'Current workspace not found',
          'WORKSPACE_CURRENT_NOT_FOUND',
        ),
      );
    }

    return workspace;
  }

  private async getWorkspaceTransactionOrThrow(
    workspaceId: string,
    transactionId: string,
  ): Promise<PaymentTransaction> {
    const paymentTransaction = await this.paymentTransactionRepo.findOne({
      where: {
        id: transactionId,
        workspace: { id: workspaceId },
      },
    });

    if (!paymentTransaction) {
      throw new BadRequestException(
        errorPayload(
          'Payment transaction not found',
          'BILLING_TRANSACTION_NOT_FOUND',
        ),
      );
    }

    return paymentTransaction;
  }
}
