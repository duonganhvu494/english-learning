import { BadRequestException, Injectable, Logger } from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";

import { IsNull, LessThanOrEqual, MoreThan, Repository } from "typeorm";

import Stripe from "stripe";

import { errorPayload } from "src/common/utils/error-payload.util";

import { PlansService } from "src/plans/plans.service";

import {
  WorkspaceSubscription,
  WorkspaceSubscriptionSource,
  WorkspaceSubscriptionStatus,
} from "src/workspaces/entities/workspace-subscription.entity";

import {
  BillingProvider,
  BillingSubscription,
  BillingSubscriptionStatus,
} from "../entities/billing-subscription.entity";

import {
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "../entities/payment-transaction.entity";

import { BillingPaymentService } from "../billing-payment.service";

type StripeBillingMetadata = {
  workspaceId?: string;
  planId?: string;
  planCode?: string;
  planPriceId?: string;
  billingSubscriptionId?: string;
  paymentTransactionId?: string;
};

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    @InjectRepository(BillingSubscription)
    private readonly billingSubscriptionRepo: Repository<BillingSubscription>,

    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepo: Repository<PaymentTransaction>,

    private readonly plansService: PlansService,

    private readonly billingPaymentService: BillingPaymentService,
  ) {}

  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed": {
        await this.handleStripeCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );

        return;
      }

      case "invoice.paid": {
        await this.handleStripeInvoicePaid(event.data.object as Stripe.Invoice);

        return;
      }

      case "invoice.payment_failed": {
        await this.handleStripeInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );

        return;
      }

      case "customer.subscription.deleted": {
        await this.handleStripeSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );

        return;
      }

      default:
        return;
    }
  }

  private async handleStripeCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    if (session.mode !== "subscription") {
      return;
    }

    const billingSubscriptionId = session.metadata?.billingSubscriptionId;

    const stripeSubscriptionId = this.getStripeObjectId(session.subscription);

    if (!billingSubscriptionId || !stripeSubscriptionId) {
      this.logger.warn(
        `Unable to reconcile Stripe Checkout Session ${session.id}`,
      );

      return;
    }

    const billingSubscription = await this.billingSubscriptionRepo.findOne({
      where: {
        id: billingSubscriptionId,

        provider: BillingProvider.STRIPE,
      },
    });

    if (!billingSubscription) {
      this.logger.warn(
        `Local billing subscription ${billingSubscriptionId} was not found`,
      );

      return;
    }

    if (
      billingSubscription.providerSubscriptionRef &&
      billingSubscription.providerSubscriptionRef !== stripeSubscriptionId
    ) {
      throw new BadRequestException(
        errorPayload(
          "Stripe subscription reference does not match local billing subscription",
          "BILLING_STRIPE_SUBSCRIPTION_MISMATCH",
        ),
      );
    }

    await this.billingSubscriptionRepo.update(billingSubscription.id, {
      providerSubscriptionRef: stripeSubscriptionId,
    });
  }

  private async handleStripeInvoicePaid(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const metadata = this.getStripeInvoiceMetadata(invoice);

    const stripeSubscriptionId = this.getStripeInvoiceSubscriptionId(invoice);

    const billingSubscription = await this.findStripeBillingSubscription(
      metadata,
      stripeSubscriptionId,
    );

    if (!billingSubscription) {
      this.logger.warn(`Unable to reconcile Stripe invoice ${invoice.id}`);

      return;
    }

    const paymentTransaction = await this.getOrCreateStripeInvoiceTransaction(
      invoice,
      billingSubscription,
      metadata,
      invoice.amount_paid,
    );

    const period = this.getStripeInvoicePeriod(invoice);

    const paidAtTimestamp = invoice.status_transitions?.paid_at;

    await this.billingPaymentService.applySuccessfulPayment(
      paymentTransaction.id,
      {
        providerTransactionRef: invoice.id,

        paidAt: paidAtTimestamp ? new Date(paidAtTimestamp * 1000) : new Date(),

        billingPeriodStart: period.start,

        billingPeriodEnd: period.end,

        amountCents: invoice.amount_paid,
      },
    );
  }

  private async handleStripeInvoicePaymentFailed(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const metadata = this.getStripeInvoiceMetadata(invoice);

    const stripeSubscriptionId = this.getStripeInvoiceSubscriptionId(invoice);

    const billingSubscription = await this.findStripeBillingSubscription(
      metadata,
      stripeSubscriptionId,
    );

    if (!billingSubscription) {
      this.logger.warn(
        `Unable to reconcile failed Stripe invoice ${invoice.id}`,
      );

      return;
    }

    const paymentTransaction = await this.getOrCreateStripeInvoiceTransaction(
      invoice,
      billingSubscription,
      metadata,
      invoice.amount_due,
    );

    const period = this.getStripeInvoicePeriod(invoice);

    await this.billingPaymentService.applyFailedPayment(paymentTransaction.id, {
      providerTransactionRef: invoice.id,

      failedAt: new Date(),

      failureReason: "Stripe invoice payment failed",

      billingPeriodStart: period.start,

      billingPeriodEnd: period.end,

      amountCents: invoice.amount_due,
    });
  }

  private async handleStripeSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const metadata = stripeSubscription.metadata as StripeBillingMetadata;

    const billingSubscription = await this.findStripeBillingSubscription(
      metadata,
      stripeSubscription.id,
    );

    if (!billingSubscription) {
      this.logger.warn(
        `Unable to reconcile deleted Stripe subscription ${stripeSubscription.id}`,
      );

      return;
    }

    const endedAt = stripeSubscription.ended_at
      ? new Date(stripeSubscription.ended_at * 1000)
      : new Date();

    const cancelledAt = stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000)
      : endedAt;

    const freePlan = await this.plansService.getDefaultPlan();

    await this.billingSubscriptionRepo.manager.transaction(async (manager) => {
      const billingSubscriptionRepo =
        manager.getRepository(BillingSubscription);

      const workspaceSubscriptionRepo = manager.getRepository(
        WorkspaceSubscription,
      );

      const lockedBillingSubscription = await billingSubscriptionRepo.findOne({
        where: {
          id: billingSubscription.id,
        },

        lock: {
          mode: "pessimistic_write",
        },
      });

      if (!lockedBillingSubscription) {
        return;
      }

      const billingSubscriptionWithRelations =
        await billingSubscriptionRepo.findOne({
          where: {
            id: lockedBillingSubscription.id,
          },

          relations: {
            workspace: true,

            plan: true,
          },
        });

      if (!billingSubscriptionWithRelations) {
        return;
      }

      if (
        lockedBillingSubscription.status ===
          BillingSubscriptionStatus.CANCELLED &&
        lockedBillingSubscription.endedAt
      ) {
        return;
      }

      lockedBillingSubscription.status = BillingSubscriptionStatus.CANCELLED;

      lockedBillingSubscription.cancelAtPeriodEnd =
        stripeSubscription.cancel_at_period_end;

      lockedBillingSubscription.cancelledAt = cancelledAt;

      lockedBillingSubscription.endedAt = endedAt;

      lockedBillingSubscription.providerSubscriptionRef = stripeSubscription.id;
      lockedBillingSubscription.nextPlan = null;

      await billingSubscriptionRepo.save(lockedBillingSubscription);

      const paidWorkspaceSubscription = await workspaceSubscriptionRepo.findOne(
        {
          where: {
            workspace: {
              id: billingSubscriptionWithRelations.workspace.id,
            },

            plan: {
              id: billingSubscriptionWithRelations.plan.id,
            },

            source: WorkspaceSubscriptionSource.BILLING_PAYMENT,

            status: WorkspaceSubscriptionStatus.ACTIVE,

            startedAt: LessThanOrEqual(endedAt),
          },

          relations: {
            plan: true,
          },

          order: {
            startedAt: "DESC",
          },
        },
      );

      let fallbackAt = endedAt;

      if (paidWorkspaceSubscription) {
        if (
          paidWorkspaceSubscription.endedAt &&
          paidWorkspaceSubscription.endedAt < endedAt
        ) {
          fallbackAt = paidWorkspaceSubscription.endedAt;
        }

        paidWorkspaceSubscription.status = WorkspaceSubscriptionStatus.EXPIRED;

        paidWorkspaceSubscription.endedAt = fallbackAt;

        await workspaceSubscriptionRepo.save(paidWorkspaceSubscription);
      }

      /*
       * Có entitlement khác đang valid,
       * ví dụ ADMIN_OVERRIDE,
       * thì không ép về Free.
       */
      const anotherUsableSubscription = await workspaceSubscriptionRepo.findOne(
        {
          where: [
            {
              workspace: {
                id: billingSubscriptionWithRelations.workspace.id,
              },

              status: WorkspaceSubscriptionStatus.ACTIVE,

              startedAt: LessThanOrEqual(fallbackAt),

              endedAt: IsNull(),
            },

            {
              workspace: {
                id: billingSubscriptionWithRelations.workspace.id,
              },

              status: WorkspaceSubscriptionStatus.ACTIVE,

              startedAt: LessThanOrEqual(fallbackAt),

              endedAt: MoreThan(fallbackAt),
            },
          ],

          order: {
            startedAt: "DESC",
          },
        },
      );

      if (anotherUsableSubscription) {
        return;
      }

      await workspaceSubscriptionRepo.save(
        workspaceSubscriptionRepo.create({
          workspace: billingSubscriptionWithRelations.workspace,

          plan: freePlan,

          status: WorkspaceSubscriptionStatus.ACTIVE,

          startedAt: fallbackAt,

          endedAt: null,

          source: WorkspaceSubscriptionSource.BILLING_FALLBACK,

          paymentTransactionId: null,

          note: "Reverted to free plan after Stripe subscription ended",
        }),
      );
    });
  }

  private async getOrCreateStripeInvoiceTransaction(
    invoice: Stripe.Invoice,
    billingSubscription: BillingSubscription,
    metadata: StripeBillingMetadata,
    amountCents: number,
  ): Promise<PaymentTransaction> {
    const period = this.getStripeInvoicePeriod(invoice);

    const stripePriceId = this.getStripeInvoicePriceId(invoice);

    const invoicePlan =
      await this.plansService.getPlanByStripePriceIdOrThrow(stripePriceId);

    return this.paymentTransactionRepo.manager.transaction(async (manager) => {
      const billingSubscriptionRepo =
        manager.getRepository(BillingSubscription);

      const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

      const lockedBillingSubscription = await billingSubscriptionRepo.findOne({
        where: {
          id: billingSubscription.id,
        },

        lock: {
          mode: "pessimistic_write",
        },
      });

      if (!lockedBillingSubscription) {
        throw new BadRequestException(
          errorPayload(
            "Billing subscription not found",
            "BILLING_SUBSCRIPTION_NOT_FOUND",
          ),
        );
      }

      const billingSubscriptionWithRelations =
        await billingSubscriptionRepo.findOne({
          where: {
            id: lockedBillingSubscription.id,
          },

          relations: {
            workspace: true,

            plan: true,
            nextPlan: true,
          },
        });

      if (!billingSubscriptionWithRelations) {
        throw new BadRequestException(
          errorPayload(
            "Billing subscription not found",
            "BILLING_SUBSCRIPTION_NOT_FOUND",
          ),
        );
      }

      /*
       * Invoice này đã map rồi.
       */
      let paymentTransaction = await paymentTransactionRepo.findOne({
        where: {
          provider: BillingProvider.STRIPE,

          providerTransactionRef: invoice.id,
        },

        relations: {
          billingSubscription: true,

          workspace: true,

          plan: true,
        },
      });

      if (paymentTransaction) {
        return paymentTransaction;
      }

      const isInitialInvoice = invoice.billing_reason === "subscription_create";

      if (isInitialInvoice && metadata.paymentTransactionId) {
        paymentTransaction = await paymentTransactionRepo.findOne({
          where: {
            id: metadata.paymentTransactionId,

            billingSubscription: {
              id: lockedBillingSubscription.id,
            },
          },

          relations: {
            billingSubscription: true,

            workspace: true,

            plan: true,
          },
        });
      }

      /*
       * Fallback cho initial invoice.
       */
      if (!paymentTransaction && isInitialInvoice) {
        paymentTransaction = await paymentTransactionRepo.findOne({
          where: {
            billingSubscription: {
              id: lockedBillingSubscription.id,
            },

            provider: BillingProvider.STRIPE,

            type: PaymentTransactionType.INITIAL_CHARGE,
          },

          relations: {
            billingSubscription: true,

            workspace: true,

            plan: true,
          },

          order: {
            createdAt: "ASC",
          },
        });
      }

      if (paymentTransaction) {
        if (
          paymentTransaction.providerTransactionRef &&
          paymentTransaction.providerTransactionRef !== invoice.id
        ) {
          throw new BadRequestException(
            errorPayload(
              "Stripe invoice reference mismatch",
              "BILLING_STRIPE_TRANSACTION_MISMATCH",
            ),
          );
        }

        paymentTransaction.providerTransactionRef = invoice.id;

        paymentTransaction.billingPeriodStart = period.start;

        paymentTransaction.billingPeriodEnd = period.end;

        paymentTransaction.amountCents = amountCents;

        return paymentTransactionRepo.save(paymentTransaction);
      }

      return paymentTransactionRepo.save(
        paymentTransactionRepo.create({
          billingSubscription: billingSubscriptionWithRelations,

          workspace: billingSubscriptionWithRelations.workspace,

          plan: invoicePlan,

          type: isInitialInvoice
            ? PaymentTransactionType.INITIAL_CHARGE
            : PaymentTransactionType.RECURRING_CHARGE,

          status: PaymentTransactionStatus.PENDING,

          amountCents,

          billingPeriodStart: period.start,

          billingPeriodEnd: period.end,

          provider: BillingProvider.STRIPE,

          providerTransactionRef: invoice.id,

          paidAt: null,

          failedAt: null,

          failureReason: null,
        }),
      );
    });
  }

  private async findStripeBillingSubscription(
    metadata: StripeBillingMetadata,
    stripeSubscriptionId: string | null,
  ): Promise<BillingSubscription | null> {
    let billingSubscription: BillingSubscription | null = null;

    /*
     * Ưu tiên internal ID trong metadata.
     */
    if (metadata.billingSubscriptionId) {
      billingSubscription = await this.billingSubscriptionRepo.findOne({
        where: {
          id: metadata.billingSubscriptionId,

          provider: BillingProvider.STRIPE,
        },

        relations: {
          workspace: true,
          plan: true,
          nextPlan: true,
        },
      });
    }

    /*
     * Fallback bằng sub_xxx.
     */
    if (!billingSubscription && stripeSubscriptionId) {
      billingSubscription = await this.billingSubscriptionRepo.findOne({
        where: {
          provider: BillingProvider.STRIPE,

          providerSubscriptionRef: stripeSubscriptionId,
        },

        relations: {
          workspace: true,
          plan: true,
          nextPlan: true,
        },
      });
    }

    if (!billingSubscription) {
      return null;
    }

    if (
      metadata.workspaceId &&
      metadata.workspaceId !== billingSubscription.workspace.id
    ) {
      throw new BadRequestException(
        errorPayload(
          "Stripe workspace metadata mismatch",
          "BILLING_STRIPE_WORKSPACE_MISMATCH",
        ),
      );
    }

    if (stripeSubscriptionId) {
      if (
        billingSubscription.providerSubscriptionRef &&
        billingSubscription.providerSubscriptionRef !== stripeSubscriptionId
      ) {
        throw new BadRequestException(
          errorPayload(
            "Stripe subscription reference mismatch",
            "BILLING_STRIPE_SUBSCRIPTION_MISMATCH",
          ),
        );
      }

      if (!billingSubscription.providerSubscriptionRef) {
        await this.billingSubscriptionRepo.update(billingSubscription.id, {
          providerSubscriptionRef: stripeSubscriptionId,
        });

        billingSubscription.providerSubscriptionRef = stripeSubscriptionId;
      }
    }

    return billingSubscription;
  }

  private getStripeInvoiceMetadata(
    invoice: Stripe.Invoice,
  ): StripeBillingMetadata {
    /*
     * Stripe API mới:
     *
     * invoice.parent.subscription_details.metadata
     */
    const typedInvoice = invoice as unknown as {
      parent?: {
        type?: string;

        subscription_details?: {
          metadata?: Record<string, string> | null;
        } | null;
      } | null;

      subscription_details?: {
        metadata?: Record<string, string> | null;
      } | null;
    };

    const parentMetadata = typedInvoice.parent?.subscription_details?.metadata;

    if (parentMetadata) {
      return parentMetadata as StripeBillingMetadata;
    }

    return (typedInvoice.subscription_details?.metadata ??
      {}) as StripeBillingMetadata;
  }

  private getStripeInvoiceSubscriptionId(
    invoice: Stripe.Invoice,
  ): string | null {
    const typedInvoice = invoice as unknown as {
      parent?: {
        type?: string;

        subscription_details?: {
          subscription?:
            | string
            | {
                id: string;
              }
            | null;
        } | null;
      } | null;

      subscription?:
        | string
        | {
            id: string;
          }
        | null;
    };

    const parentSubscription =
      typedInvoice.parent?.subscription_details?.subscription;

    if (parentSubscription) {
      return this.getStripeObjectId(parentSubscription);
    }

    return this.getStripeObjectId(typedInvoice.subscription);
  }

  private getStripeInvoicePeriod(invoice: Stripe.Invoice): {
    start: Date;
    end: Date;
  } {
    const subscriptionLine =
      invoice.lines.data.find((line) => {
        const typedLine = line as unknown as {
          parent?: {
            type?: string;
          } | null;
        };

        return typedLine.parent?.type === "subscription_item_details";
      }) ?? invoice.lines.data[0];

    if (!subscriptionLine) {
      throw new BadRequestException(
        errorPayload(
          "Stripe invoice does not contain a billing period",
          "BILLING_STRIPE_INVOICE_PERIOD_MISSING",
        ),
      );
    }

    return {
      start: new Date(subscriptionLine.period.start * 1000),

      end: new Date(subscriptionLine.period.end * 1000),
    };
  }

  private getStripeInvoicePriceId(invoice: Stripe.Invoice): string {
    const subscriptionLine =
      invoice.lines.data.find((line) => {
        const typedLine = line as unknown as {
          parent?: {
            type?: string;
          } | null;
        };

        return typedLine.parent?.type === "subscription_item_details";
      }) ?? invoice.lines.data[0];

    if (!subscriptionLine) {
      throw new BadRequestException(
        errorPayload(
          "Stripe invoice does not contain a subscription line",
          "BILLING_STRIPE_INVOICE_PRICE_MISSING",
        ),
      );
    }

    const typedLine = subscriptionLine as unknown as {
      pricing?: {
        price_details?: {
          price?: string | null;
        } | null;
      } | null;

      price?: {
        id: string;
      } | null;
    };

    const stripePriceId =
      typedLine.pricing?.price_details?.price ?? typedLine.price?.id ?? null;

    if (!stripePriceId) {
      throw new BadRequestException(
        errorPayload(
          "Stripe invoice price ID is missing",
          "BILLING_STRIPE_INVOICE_PRICE_MISSING",
        ),
      );
    }

    return stripePriceId;
  }

  private getStripeObjectId(
    value:
      | string
      | {
          id: string;
        }
      | null
      | undefined,
  ): string | null {
    if (!value) {
      return null;
    }

    return typeof value === "string" ? value : value.id;
  }
}
