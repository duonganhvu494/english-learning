import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import {
  EntityManager,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";

import { errorPayload } from "src/common/utils/error-payload.util";

import {
  WorkspaceSubscription,
  WorkspaceSubscriptionSource,
  WorkspaceSubscriptionStatus,
} from "src/workspaces/entities/workspace-subscription.entity";

import {
  BillingSubscription,
  BillingSubscriptionStatus,
} from "./entities/billing-subscription.entity";

import {
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "./entities/payment-transaction.entity";

export type SuccessfulPaymentInput = {
  providerTransactionRef: string;
  paidAt: Date;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  amountCents?: number;
};

export type FailedPaymentInput = {
  providerTransactionRef: string;
  failedAt: Date;
  failureReason: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  amountCents?: number;
};

@Injectable()
export class BillingPaymentService {
  private readonly renewalBufferMinutes = 90;
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepo: Repository<PaymentTransaction>,
  ) {}

  async applySuccessfulPayment(
    transactionId: string,
    input: SuccessfulPaymentInput,
  ): Promise<PaymentTransaction> {
    return this.paymentTransactionRepo.manager.transaction(async (manager) => {
      const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

      const billingSubscriptionRepo =
        manager.getRepository(BillingSubscription);

      const lockedPaymentTransaction = await paymentTransactionRepo.findOne({
        where: {
          id: transactionId,
        },

        lock: {
          mode: "pessimistic_write",
        },
      });

      if (!lockedPaymentTransaction) {
        throw new BadRequestException(
          errorPayload(
            "Payment transaction not found",
            "BILLING_TRANSACTION_NOT_FOUND",
          ),
        );
      }

      const paymentTransaction = await paymentTransactionRepo.findOne({
        where: {
          id: lockedPaymentTransaction.id,
        },

        relations: {
          billingSubscription: {
            workspace: true,
            plan: true,
            nextPlan: true,
          },

          workspace: true,

          plan: true,
        },
      });

      if (!paymentTransaction) {
        throw new BadRequestException(
          errorPayload(
            "Payment transaction not found",
            "BILLING_TRANSACTION_NOT_FOUND",
          ),
        );
      }

      if (paymentTransaction.status === PaymentTransactionStatus.PAID) {
        return paymentTransaction;
      }

      /*
       * Stripe có thể:
       *
       * FAILED → retry → PAID
       */
      if (
        paymentTransaction.status !== PaymentTransactionStatus.PENDING &&
        paymentTransaction.status !== PaymentTransactionStatus.FAILED
      ) {
        throw new BadRequestException(
          errorPayload(
            "Payment transaction cannot be marked as paid",
            "BILLING_TRANSACTION_STATUS_INVALID",
          ),
        );
      }

      if (
        paymentTransaction.providerTransactionRef &&
        paymentTransaction.providerTransactionRef !==
          input.providerTransactionRef
      ) {
        throw new BadRequestException(
          errorPayload(
            "Stripe invoice reference mismatch",
            "BILLING_STRIPE_TRANSACTION_MISMATCH",
          ),
        );
      }

      paymentTransaction.status = PaymentTransactionStatus.PAID;

      paymentTransaction.paidAt = input.paidAt;

      paymentTransaction.failedAt = null;

      paymentTransaction.failureReason = null;

      paymentTransaction.providerTransactionRef = input.providerTransactionRef;

      if (input.billingPeriodStart) {
        paymentTransaction.billingPeriodStart = input.billingPeriodStart;
      }

      if (input.billingPeriodEnd) {
        paymentTransaction.billingPeriodEnd = input.billingPeriodEnd;
      }

      if (input.amountCents !== undefined) {
        paymentTransaction.amountCents = input.amountCents;
      }

      const savedTransaction =
        await paymentTransactionRepo.save(paymentTransaction);

      const billingSubscription = paymentTransaction.billingSubscription;

      if (
        (billingSubscription.status === BillingSubscriptionStatus.CANCELLED ||
          billingSubscription.status === BillingSubscriptionStatus.EXPIRED) &&
        billingSubscription.endedAt
      ) {
        return savedTransaction;
      }

      /*
       * Stripe invoice là source of truth của plan được charge.
       * Nếu đây là renewal sang plan mới thì đổi current plan local
       * chỉ sau khi invoice đã PAID.
       */
      billingSubscription.plan = paymentTransaction.plan;
      billingSubscription.nextPlan = null;

      billingSubscription.status = BillingSubscriptionStatus.ACTIVE;

      billingSubscription.activatedAt =
        billingSubscription.activatedAt ?? savedTransaction.paidAt;

      billingSubscription.currentPeriodStart =
        savedTransaction.billingPeriodStart;

      billingSubscription.currentPeriodEnd = savedTransaction.billingPeriodEnd;

      billingSubscription.endedAt = null;

      await billingSubscriptionRepo.save(billingSubscription);

      await this.syncWorkspaceSubscription(
        manager,
        billingSubscription,
        savedTransaction,
      );

      return savedTransaction;
    });
  }

  async applyFailedPayment(
    transactionId: string,
    input: FailedPaymentInput,
  ): Promise<PaymentTransaction> {
    return this.paymentTransactionRepo.manager.transaction(async (manager) => {
      const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

      const billingSubscriptionRepo =
        manager.getRepository(BillingSubscription);

      const lockedPaymentTransaction = await paymentTransactionRepo.findOne({
        where: {
          id: transactionId,
        },

        lock: {
          mode: "pessimistic_write",
        },
      });

      if (!lockedPaymentTransaction) {
        throw new BadRequestException(
          errorPayload(
            "Payment transaction not found",
            "BILLING_TRANSACTION_NOT_FOUND",
          ),
        );
      }

      const paymentTransaction = await paymentTransactionRepo.findOne({
        where: {
          id: lockedPaymentTransaction.id,
        },

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
            "Payment transaction not found",
            "BILLING_TRANSACTION_NOT_FOUND",
          ),
        );
      }

      /*
       * invoice.paid đã được xử lý.
       * Event failed cũ đến trễ không được
       * downgrade PAID → FAILED.
       */
      if (paymentTransaction.status === PaymentTransactionStatus.PAID) {
        return paymentTransaction;
      }

      if (
        paymentTransaction.status === PaymentTransactionStatus.FAILED &&
        paymentTransaction.providerTransactionRef ===
          input.providerTransactionRef
      ) {
        return paymentTransaction;
      }

      if (
        paymentTransaction.providerTransactionRef &&
        paymentTransaction.providerTransactionRef !==
          input.providerTransactionRef
      ) {
        throw new BadRequestException(
          errorPayload(
            "Stripe invoice reference mismatch",
            "BILLING_STRIPE_TRANSACTION_MISMATCH",
          ),
        );
      }

      paymentTransaction.status = PaymentTransactionStatus.FAILED;

      paymentTransaction.failedAt = input.failedAt;

      paymentTransaction.paidAt = null;

      paymentTransaction.failureReason = input.failureReason;

      paymentTransaction.providerTransactionRef = input.providerTransactionRef;

      if (input.billingPeriodStart) {
        paymentTransaction.billingPeriodStart = input.billingPeriodStart;
      }

      if (input.billingPeriodEnd) {
        paymentTransaction.billingPeriodEnd = input.billingPeriodEnd;
      }

      if (input.amountCents !== undefined) {
        paymentTransaction.amountCents = input.amountCents;
      }

      const savedTransaction =
        await paymentTransactionRepo.save(paymentTransaction);

      const billingSubscription = paymentTransaction.billingSubscription;

      /*
       * Terminal billing không đổi lại.
       */
      if (
        billingSubscription.status === BillingSubscriptionStatus.CANCELLED ||
        billingSubscription.status === BillingSubscriptionStatus.EXPIRED
      ) {
        return savedTransaction;
      }

      const isInitialUnactivated =
        paymentTransaction.type === PaymentTransactionType.INITIAL_CHARGE &&
        !billingSubscription.activatedAt;

      if (isInitialUnactivated) {
        /*
         * Initial payment failed.
         *
         * Không expire ngay vì Stripe có
         * thể retry / user có thể hoàn tất
         * authentication sau.
         */
        billingSubscription.status =
          BillingSubscriptionStatus.PENDING_ACTIVATION;

        billingSubscription.endedAt = null;
      } else {
        billingSubscription.status = BillingSubscriptionStatus.PAST_DUE;
      }

      await billingSubscriptionRepo.save(billingSubscription);

      return savedTransaction;
    });
  }

  private async syncWorkspaceSubscription(
    manager: EntityManager,
    billingSubscription: BillingSubscription,
    paymentTransaction: PaymentTransaction,
  ): Promise<void> {
    const workspaceSubscriptionRepo = manager.getRepository(
      WorkspaceSubscription,
    );

    const activeWorkspaceSubscription =
      await this.findCurrentWorkspaceSubscription(
        workspaceSubscriptionRepo,
        billingSubscription.workspace.id,
        paymentTransaction.billingPeriodStart,
      );

    const isRenewingSamePaidPlan =
      activeWorkspaceSubscription !== null &&
      activeWorkspaceSubscription.source ===
        WorkspaceSubscriptionSource.BILLING_PAYMENT &&
      activeWorkspaceSubscription.plan.id === billingSubscription.plan.id;

    if (isRenewingSamePaidPlan) {
      await this.renewWorkspaceSubscription(
        workspaceSubscriptionRepo,
        activeWorkspaceSubscription,
        paymentTransaction,
      );

      return;
    }

    if (activeWorkspaceSubscription) {
      await this.expireWorkspaceSubscription(
        workspaceSubscriptionRepo,
        activeWorkspaceSubscription,
        paymentTransaction.billingPeriodStart,
      );
    }

    await this.createPaidWorkspaceSubscription(
      workspaceSubscriptionRepo,
      billingSubscription,
      paymentTransaction,
    );
  }

  private async findCurrentWorkspaceSubscription(
    workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
    workspaceId: string,
    at: Date,
  ): Promise<WorkspaceSubscription | null> {
    return workspaceSubscriptionRepo.findOne({
      where: [
        {
          workspace: {
            id: workspaceId,
          },

          status: WorkspaceSubscriptionStatus.ACTIVE,

          startedAt: LessThanOrEqual(at),

          endedAt: IsNull(),
        },

        {
          workspace: {
            id: workspaceId,
          },

          status: WorkspaceSubscriptionStatus.ACTIVE,

          startedAt: LessThanOrEqual(at),

          /*
           * Renewal thường:
           * old endedAt === new periodStart
           *
           * nên cần >= chứ không phải >.
           */
          endedAt: MoreThanOrEqual(at),
        },
      ],

      relations: {
        workspace: true,

        plan: true,
      },

      order: {
        startedAt: "DESC",
      },
    });
  }

  private async renewWorkspaceSubscription(
    workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
    workspaceSubscription: WorkspaceSubscription,
    paymentTransaction: PaymentTransaction,
  ): Promise<void> {
    workspaceSubscription.status = WorkspaceSubscriptionStatus.ACTIVE;

    workspaceSubscription.endedAt = this.addMinutes(
      paymentTransaction.billingPeriodEnd,
      this.renewalBufferMinutes,
    );

    workspaceSubscription.paymentTransactionId = paymentTransaction.id;

    workspaceSubscription.note =
      this.buildWorkspaceSubscriptionNote(paymentTransaction);

    await workspaceSubscriptionRepo.save(workspaceSubscription);
  }

  private async expireWorkspaceSubscription(
    workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
    workspaceSubscription: WorkspaceSubscription,
    endedAt: Date,
  ): Promise<void> {
    workspaceSubscription.status = WorkspaceSubscriptionStatus.EXPIRED;

    workspaceSubscription.endedAt = endedAt;

    await workspaceSubscriptionRepo.save(workspaceSubscription);
  }

  private async createPaidWorkspaceSubscription(
    workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
    billingSubscription: BillingSubscription,
    paymentTransaction: PaymentTransaction,
  ): Promise<void> {
    await workspaceSubscriptionRepo.save(
      workspaceSubscriptionRepo.create({
        workspace: billingSubscription.workspace,

        plan: billingSubscription.plan,

        status: WorkspaceSubscriptionStatus.ACTIVE,

        startedAt: paymentTransaction.billingPeriodStart,

        endedAt: this.addMinutes(
          paymentTransaction.billingPeriodEnd,
          this.renewalBufferMinutes,
        ),

        source: WorkspaceSubscriptionSource.BILLING_PAYMENT,

        paymentTransactionId: paymentTransaction.id,

        note: this.buildWorkspaceSubscriptionNote(paymentTransaction),
      }),
    );
  }

  private buildWorkspaceSubscriptionNote(
    paymentTransaction: PaymentTransaction,
  ): string {
    if (paymentTransaction.type === PaymentTransactionType.RECURRING_CHARGE) {
      return (
        `Renewed ` +
        `${paymentTransaction.plan.code} ` +
        `plan from Stripe payment`
      );
    }

    return (
      `Activated ` +
      `${paymentTransaction.plan.code} ` +
      `plan from Stripe payment`
    );
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }
}
