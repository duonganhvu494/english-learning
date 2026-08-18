// import { BadRequestException, Injectable, Logger } from "@nestjs/common";

// import { InjectRepository } from "@nestjs/typeorm";

// import {
//   EntityManager,
//   In,
//   IsNull,
//   LessThanOrEqual,
//   MoreThan,
//   MoreThanOrEqual,
//   Repository,
// } from "typeorm";

// import Stripe from "stripe";

// import { errorPayload } from "src/common/utils/error-payload.util";

// import { PlansService } from "src/plans/plans.service";
// import { PlanBillingInterval } from "src/plans/entities/plan-price.entity";

// import { Workspace } from "src/workspaces/entities/workspace.entity";

// import {
//   WorkspaceSubscription,
//   WorkspaceSubscriptionSource,
//   WorkspaceSubscriptionStatus,
// } from "src/workspaces/entities/workspace-subscription.entity";

// import {
//   BillingCycle,
//   BillingProvider,
//   BillingSubscription,
//   BillingSubscriptionStatus,
// } from "./entities/billing-subscription.entity";

// import {
//   PaymentTransaction,
//   PaymentTransactionStatus,
//   PaymentTransactionType,
// } from "./entities/payment-transaction.entity";

// import { StripeService } from "./stripe/stripe.service";

// type StripeBillingMetadata = {
//   workspaceId?: string;
//   planId?: string;
//   planCode?: string;
//   planPriceId?: string;
//   billingSubscriptionId?: string;
//   paymentTransactionId?: string;
// };

// type SuccessfulPaymentInput = {
//   providerTransactionRef: string;

//   paidAt: Date;

//   billingPeriodStart?: Date;
//   billingPeriodEnd?: Date;

//   amountCents?: number;
// };

// type FailedPaymentInput = {
//   providerTransactionRef: string;

//   failedAt: Date;

//   failureReason: string;

//   billingPeriodStart?: Date;
//   billingPeriodEnd?: Date;

//   amountCents?: number;
// };

// @Injectable()
// export class BillingService {
//   private readonly logger = new Logger(BillingService.name);

//   private readonly billingCurrency = "USD";

//   private readonly billingInterval = PlanBillingInterval.MONTHLY;

//   constructor(
//     @InjectRepository(BillingSubscription)
//     private readonly billingSubscriptionRepo: Repository<BillingSubscription>,

//     @InjectRepository(PaymentTransaction)
//     private readonly paymentTransactionRepo: Repository<PaymentTransaction>,

//     @InjectRepository(Workspace)
//     private readonly workspaceRepo: Repository<Workspace>,

//     private readonly plansService: PlansService,

//     private readonly stripeService: StripeService,
//   ) {}

//   async startMyWorkspacePlanSubscription(
//     userId: string,
//     planCode: string,
//   ): Promise<{
//     sessionId: string;
//     checkoutUrl: string;
//   }> {
//     const workspace = await this.getOwnedWorkspaceOrThrow(userId);

//     const { plan, price } = await this.getBillablePlanAndPrice(planCode);

//     const currentBillingSubscription = await this.getOpenBillingSubscription(
//       workspace.id,
//     );

//     if (currentBillingSubscription) {
//       if (
//         currentBillingSubscription.status ===
//           BillingSubscriptionStatus.ACTIVE &&
//         currentBillingSubscription.plan.id === plan.id
//       ) {
//         throw new BadRequestException(
//           errorPayload(
//             "Workspace is already subscribed to this plan",
//             "BILLING_ALREADY_SUBSCRIBED_TO_PLAN",
//           ),
//         );
//       }

//       throw new BadRequestException(
//         errorPayload(
//           "Workspace already has a billing subscription",
//           "BILLING_SUBSCRIPTION_ALREADY_EXISTS",
//         ),
//       );
//     }

//     /*
//      * Chỉ là provisional period vì Stripe
//      * chưa tạo subscription thật.
//      *
//      * invoice.paid / payment_failed sẽ
//      * overwrite bằng period thật của Stripe.
//      */
//     const provisionalPeriodStart = new Date();

//     const provisionalPeriodEnd = this.addMonths(provisionalPeriodStart, 1);

//     const { billingSubscription, paymentTransaction } =
//       await this.billingSubscriptionRepo.manager.transaction(
//         async (manager) => {
//           const billingSubscriptionRepo =
//             manager.getRepository(BillingSubscription);

//           const paymentTransactionRepo =
//             manager.getRepository(PaymentTransaction);

//           /*
//            * Local billing tồn tại trước Checkout.
//            * Chưa thanh toán nên chưa ACTIVE.
//            */
//           const billingSubscription = await billingSubscriptionRepo.save(
//             billingSubscriptionRepo.create({
//               workspace,
//               plan,
//               nextPlan: null,

//               status: BillingSubscriptionStatus.PENDING_ACTIVATION,

//               provider: BillingProvider.STRIPE,

//               /*
//                * checkout.session.completed
//                * sẽ ghi sub_xxx vào đây.
//                */
//               providerSubscriptionRef: null,

//               billingCycle: BillingCycle.MONTHLY,

//               activatedAt: null,

//               currentPeriodStart: null,

//               currentPeriodEnd: null,

//               cancelAtPeriodEnd: false,

//               cancelledAt: null,

//               endedAt: null,
//             }),
//           );

//           /*
//            * Payment attempt đầu tiên.
//            */
//           const paymentTransaction = await paymentTransactionRepo.save(
//             paymentTransactionRepo.create({
//               billingSubscription,

//               workspace,
//               plan,

//               type: PaymentTransactionType.INITIAL_CHARGE,

//               status: PaymentTransactionStatus.PENDING,

//               amountCents: price.amount,

//               billingPeriodStart: provisionalPeriodStart,

//               billingPeriodEnd: provisionalPeriodEnd,

//               provider: BillingProvider.STRIPE,

//               /*
//                * invoice.paid /
//                * invoice.payment_failed
//                * sẽ ghi in_xxx vào đây.
//                */
//               providerTransactionRef: null,

//               paidAt: null,

//               failedAt: null,

//               failureReason: null,
//             }),
//           );

//           return {
//             billingSubscription,
//             paymentTransaction,
//           };
//         },
//       );

//     try {
//       return await this.stripeService.createSubscriptionCheckoutSession({
//         workspaceId: workspace.id,
//         planId: plan.id,
//         planCode: plan.code,
//         planPriceId: price.id,
//         billingSubscriptionId: billingSubscription.id,
//         paymentTransactionId: paymentTransaction.id,
//         stripePriceId: price.stripePriceId!,
//       });
//     } catch (error) {
//       await this.failStripeCheckoutInitialization(
//         billingSubscription.id,
//         paymentTransaction.id,
//       );

//       throw error;
//     }
//   }

//   async getMyBillingSubscription(
//     userId: string,
//   ): Promise<BillingSubscription | null> {
//     const workspace = await this.getOwnedWorkspaceOrThrow(userId);

//     return this.getCurrentBillingSubscription(workspace.id);
//   }

//   async getCurrentBillingSubscription(
//     workspaceId: string,
//   ): Promise<BillingSubscription | null> {
//     return this.billingSubscriptionRepo.findOne({
//       where: {
//         workspace: {
//           id: workspaceId,
//         },

//         endedAt: IsNull(),
//       },

//       relations: {
//         workspace: true,

//         plan: {
//           features: true,
//           prices: true,
//         },

//         nextPlan: {
//           features: true,
//           prices: true,
//         },
//       },

//       order: {
//         createdAt: "DESC",
//       },
//     });
//   }

//   // =====================================================
//   // CHANGE / CANCEL PLAN
//   // =====================================================

//   async changeMyBillingPlan(
//     userId: string,
//     targetPlanCode: string,
//   ): Promise<BillingSubscription> {
//     const workspace = await this.getOwnedWorkspaceOrThrow(userId);

//     const billingSubscription = await this.billingSubscriptionRepo.findOne({
//       where: {
//         workspace: {
//           id: workspace.id,
//         },

//         endedAt: IsNull(),
//       },

//       relations: {
//         workspace: true,

//         plan: {
//           features: true,
//           prices: true,
//         },

//         nextPlan: {
//           features: true,
//           prices: true,
//         },
//       },

//       order: {
//         createdAt: "DESC",
//       },
//     });

//     if (!billingSubscription) {
//       throw new BadRequestException(
//         errorPayload(
//           "Billing subscription not found. Start a paid subscription first.",
//           "BILLING_SUBSCRIPTION_NOT_FOUND",
//         ),
//       );
//     }

//     if (
//       billingSubscription.provider !== BillingProvider.STRIPE ||
//       !billingSubscription.providerSubscriptionRef
//     ) {
//       throw new BadRequestException(
//         errorPayload(
//           "Stripe subscription reference is missing",
//           "BILLING_STRIPE_SUBSCRIPTION_REF_MISSING",
//         ),
//       );
//     }

//     const normalizedTargetPlanCode = targetPlanCode.trim().toLowerCase();

//     /*
//      * Paid -> Free:
//      * giữ plan hiện tại tới hết kỳ rồi Stripe cancel.
//      *
//      * Nếu trước đó đã schedule một paid plan khác,
//      * đưa Stripe price về current plan trước khi cancel.
//      */
//     if (normalizedTargetPlanCode === "free") {
//       if (
//         billingSubscription.status !== BillingSubscriptionStatus.ACTIVE &&
//         billingSubscription.status !== BillingSubscriptionStatus.PAST_DUE
//       ) {
//         throw new BadRequestException(
//           errorPayload(
//             "Billing subscription cannot be cancelled",
//             "BILLING_SUBSCRIPTION_STATUS_INVALID",
//           ),
//         );
//       }

//       const currentPrice = await this.getBillablePriceForPlan(
//         billingSubscription.plan.code,
//       );

//       const stripeSubscription =
//         await this.stripeService.configureSubscriptionRenewal({
//           subscriptionId: billingSubscription.providerSubscriptionRef,
//           stripePriceId: currentPrice.stripePriceId!,
//           cancelAtPeriodEnd: true,
//         });

//       billingSubscription.nextPlan = null;
//       billingSubscription.cancelAtPeriodEnd =
//         stripeSubscription.cancel_at_period_end;
//       billingSubscription.cancelledAt = new Date();

//       return this.billingSubscriptionRepo.save(billingSubscription);
//     }

//     /*
//      * Paid -> Paid chỉ cho đổi khi subscription đang ACTIVE.
//      * PAST_DUE phải xử lý payment trước.
//      */
//     if (billingSubscription.status !== BillingSubscriptionStatus.ACTIVE) {
//       throw new BadRequestException(
//         errorPayload(
//           "Only active billing subscriptions can change plan",
//           "BILLING_SUBSCRIPTION_STATUS_INVALID",
//         ),
//       );
//     }

//     const { plan: targetPlan, price: targetPrice } =
//       await this.getBillablePlanAndPrice(normalizedTargetPlanCode);

//     /*
//      * Chọn lại current plan:
//      * - hủy pending plan change nếu có
//      * - undo cancel-at-period-end nếu trước đó chọn Free
//      * - tiếp tục renewal current plan.
//      */
//     if (targetPlan.id === billingSubscription.plan.id) {
//       const stripeSubscription =
//         await this.stripeService.configureSubscriptionRenewal({
//           subscriptionId: billingSubscription.providerSubscriptionRef,
//           stripePriceId: targetPrice.stripePriceId!,
//           cancelAtPeriodEnd: false,
//         });

//       billingSubscription.nextPlan = null;
//       billingSubscription.cancelAtPeriodEnd =
//         stripeSubscription.cancel_at_period_end;
//       billingSubscription.cancelledAt = null;

//       return this.billingSubscriptionRepo.save(billingSubscription);
//     }

//     /*
//      * Paid -> another paid plan:
//      *
//      * Stripe đổi Price ngay trên subscription item nhưng
//      * proration_behavior = none nên không thu thêm ngay.
//      * Kỳ hiện tại vẫn dùng entitlement hiện tại của local DB.
//      * Tới renewal Stripe tự charge target price.
//      */
//     const stripeSubscription =
//       await this.stripeService.configureSubscriptionRenewal({
//         subscriptionId: billingSubscription.providerSubscriptionRef,
//         stripePriceId: targetPrice.stripePriceId!,
//         cancelAtPeriodEnd: false,
//       });

//     billingSubscription.nextPlan = targetPlan;
//     billingSubscription.cancelAtPeriodEnd =
//       stripeSubscription.cancel_at_period_end;
//     billingSubscription.cancelledAt = null;

//     return this.billingSubscriptionRepo.save(billingSubscription);
//   }

//   async cancelMyBillingSubscription(
//     userId: string,
//   ): Promise<BillingSubscription> {
//     return this.changeMyBillingPlan(userId, "free");
//   }

//   // =====================================================
//   // STRIPE WEBHOOK DISPATCHER
//   // =====================================================

//   async handleStripeWebhook(event: Stripe.Event): Promise<void> {
//     switch (event.type) {
//       case "checkout.session.completed": {
//         await this.handleStripeCheckoutCompleted(
//           event.data.object as Stripe.Checkout.Session,
//         );

//         return;
//       }

//       case "invoice.paid": {
//         await this.handleStripeInvoicePaid(
//           event.data.object as Stripe.Invoice,
//         );

//         return;
//       }

//       case "invoice.payment_failed": {
//         await this.handleStripeInvoicePaymentFailed(
//           event.data.object as Stripe.Invoice,
//         );

//         return;
//       }

//       case "customer.subscription.deleted": {
//         await this.handleStripeSubscriptionDeleted(
//           event.data.object as Stripe.Subscription,
//         );

//         return;
//       }

//       default:
//         return;
//     }
//   }

//   // =====================================================
//   // CHECKOUT COMPLETED
//   // =====================================================

//   private async handleStripeCheckoutCompleted(
//     session: Stripe.Checkout.Session,
//   ): Promise<void> {
//     if (session.mode !== "subscription") {
//       return;
//     }

//     const billingSubscriptionId = session.metadata?.billingSubscriptionId;

//     const stripeSubscriptionId = this.getStripeObjectId(session.subscription);

//     /*
//      * Có thể là Checkout Session khác
//      * không thuộc billing flow của app.
//      */
//     if (!billingSubscriptionId || !stripeSubscriptionId) {
//       this.logger.warn(
//         `Unable to reconcile Stripe Checkout Session ${session.id}`,
//       );

//       return;
//     }

//     const billingSubscription = await this.billingSubscriptionRepo.findOne({
//       where: {
//         id: billingSubscriptionId,

//         provider: BillingProvider.STRIPE,
//       },
//     });

//     if (!billingSubscription) {
//       this.logger.warn(
//         `Local billing subscription ${billingSubscriptionId} was not found`,
//       );

//       return;
//     }

//     if (
//       billingSubscription.providerSubscriptionRef &&
//       billingSubscription.providerSubscriptionRef !== stripeSubscriptionId
//     ) {
//       throw new BadRequestException(
//         errorPayload(
//           "Stripe subscription reference does not match local billing subscription",
//           "BILLING_STRIPE_SUBSCRIPTION_MISMATCH",
//         ),
//       );
//     }

//     /*
//      * Chỉ update field Stripe ref.
//      *
//      * Không set ACTIVE ở đây.
//      * invoice.paid mới là nguồn xác nhận tiền.
//      *
//      * Dùng partial update để tránh ghi đè
//      * status nếu invoice.paid đến trước.
//      */
//     await this.billingSubscriptionRepo.update(billingSubscription.id, {
//       providerSubscriptionRef: stripeSubscriptionId,
//     });
//   }

//   // =====================================================
//   // INVOICE PAID
//   // =====================================================

//   private async handleStripeInvoicePaid(
//     invoice: Stripe.Invoice,
//   ): Promise<void> {
//     const metadata = this.getStripeInvoiceMetadata(invoice);

//     const stripeSubscriptionId = this.getStripeInvoiceSubscriptionId(invoice);

//     const billingSubscription = await this.findStripeBillingSubscription(
//       metadata,
//       stripeSubscriptionId,
//     );

//     if (!billingSubscription) {
//       this.logger.warn(`Unable to reconcile Stripe invoice ${invoice.id}`);

//       return;
//     }

//     const paymentTransaction = await this.getOrCreateStripeInvoiceTransaction(
//       invoice,
//       billingSubscription,
//       metadata,
//       invoice.amount_paid,
//     );

//     const period = this.getStripeInvoicePeriod(invoice);

//     const paidAtTimestamp = invoice.status_transitions?.paid_at;

//     await this.applySuccessfulPayment(paymentTransaction.id, {
//       providerTransactionRef: invoice.id,

//       paidAt: paidAtTimestamp ? new Date(paidAtTimestamp * 1000) : new Date(),

//       billingPeriodStart: period.start,

//       billingPeriodEnd: period.end,

//       amountCents: invoice.amount_paid,
//     });
//   }

//   // =====================================================
//   // INVOICE PAYMENT FAILED
//   // =====================================================

//   private async handleStripeInvoicePaymentFailed(
//     invoice: Stripe.Invoice,
//   ): Promise<void> {
//     const metadata = this.getStripeInvoiceMetadata(invoice);

//     const stripeSubscriptionId = this.getStripeInvoiceSubscriptionId(invoice);

//     const billingSubscription = await this.findStripeBillingSubscription(
//       metadata,
//       stripeSubscriptionId,
//     );

//     if (!billingSubscription) {
//       this.logger.warn(
//         `Unable to reconcile failed Stripe invoice ${invoice.id}`,
//       );

//       return;
//     }

//     const paymentTransaction = await this.getOrCreateStripeInvoiceTransaction(
//       invoice,
//       billingSubscription,
//       metadata,
//       invoice.amount_due,
//     );

//     const period = this.getStripeInvoicePeriod(invoice);

//     await this.applyFailedPayment(paymentTransaction.id, {
//       providerTransactionRef: invoice.id,

//       failedAt: new Date(),

//       failureReason: "Stripe invoice payment failed",

//       billingPeriodStart: period.start,

//       billingPeriodEnd: period.end,

//       amountCents: invoice.amount_due,
//     });
//   }

//   // =====================================================
//   // STRIPE SUBSCRIPTION ENDED
//   // =====================================================

//   private async handleStripeSubscriptionDeleted(
//     stripeSubscription: Stripe.Subscription,
//   ): Promise<void> {
//     const metadata = stripeSubscription.metadata as StripeBillingMetadata;

//     const billingSubscription = await this.findStripeBillingSubscription(
//       metadata,
//       stripeSubscription.id,
//     );

//     if (!billingSubscription) {
//       this.logger.warn(
//         `Unable to reconcile deleted Stripe subscription ${stripeSubscription.id}`,
//       );

//       return;
//     }

//     const endedAt = stripeSubscription.ended_at
//       ? new Date(stripeSubscription.ended_at * 1000)
//       : new Date();

//     const cancelledAt = stripeSubscription.canceled_at
//       ? new Date(stripeSubscription.canceled_at * 1000)
//       : endedAt;

//     const freePlan = await this.plansService.getDefaultPlan();

//     await this.billingSubscriptionRepo.manager.transaction(async (manager) => {
//       const billingSubscriptionRepo =
//         manager.getRepository(BillingSubscription);

//       const workspaceSubscriptionRepo = manager.getRepository(
//         WorkspaceSubscription,
//       );

//       /*
//        * IMPORTANT:
//        * PostgreSQL không cho FOR UPDATE trên nullable side của LEFT JOIN.
//        * Vì TypeORM `relations` sinh LEFT JOIN, ta lock root row trước,
//        * rồi load relations bằng query riêng trong cùng transaction.
//        */
//       const lockedBillingSubscription = await billingSubscriptionRepo.findOne({
//         where: {
//           id: billingSubscription.id,
//         },

//         lock: {
//           mode: "pessimistic_write",
//         },
//       });

//       if (!lockedBillingSubscription) {
//         return;
//       }

//       const billingSubscriptionWithRelations =
//         await billingSubscriptionRepo.findOne({
//           where: {
//             id: lockedBillingSubscription.id,
//           },

//           relations: {
//             workspace: true,

//             plan: true,
//           },
//         });

//       if (!billingSubscriptionWithRelations) {
//         return;
//       }

//       /*
//        * Duplicate deleted event.
//        */
//       if (
//         lockedBillingSubscription.status ===
//           BillingSubscriptionStatus.CANCELLED &&
//         lockedBillingSubscription.endedAt
//       ) {
//         return;
//       }

//       lockedBillingSubscription.status = BillingSubscriptionStatus.CANCELLED;

//       lockedBillingSubscription.cancelAtPeriodEnd =
//         stripeSubscription.cancel_at_period_end;

//       lockedBillingSubscription.cancelledAt = cancelledAt;

//       lockedBillingSubscription.endedAt = endedAt;

//       lockedBillingSubscription.providerSubscriptionRef = stripeSubscription.id;
//       lockedBillingSubscription.nextPlan = null;

//       await billingSubscriptionRepo.save(lockedBillingSubscription);

//       /*
//        * Tìm entitlement paid tương ứng.
//        *
//        * startedAt <= endedAt tránh event cũ
//        * vô tình expire entitlement mới hơn.
//        */
//       const paidWorkspaceSubscription = await workspaceSubscriptionRepo.findOne(
//         {
//           where: {
//             workspace: {
//               id: billingSubscriptionWithRelations.workspace.id,
//             },

//             plan: {
//               id: billingSubscriptionWithRelations.plan.id,
//             },

//             source: WorkspaceSubscriptionSource.BILLING_PAYMENT,

//             status: In([
//               WorkspaceSubscriptionStatus.ACTIVE,
//               WorkspaceSubscriptionStatus.TRIALING,
//             ]),

//             startedAt: LessThanOrEqual(endedAt),
//           },

//           relations: {
//             plan: true,
//           },

//           order: {
//             startedAt: "DESC",
//           },
//         },
//       );

//       /*
//        * Nếu entitlement đã hết trước khi
//        * Stripe chính thức delete subscription
//        * (ví dụ PAST_DUE lâu ngày),
//        * không kéo dài history đến endedAt.
//        */
//       let fallbackAt = endedAt;

//       if (paidWorkspaceSubscription) {
//         if (
//           paidWorkspaceSubscription.endedAt &&
//           paidWorkspaceSubscription.endedAt < endedAt
//         ) {
//           fallbackAt = paidWorkspaceSubscription.endedAt;
//         }

//         paidWorkspaceSubscription.status = WorkspaceSubscriptionStatus.EXPIRED;

//         paidWorkspaceSubscription.endedAt = fallbackAt;

//         await workspaceSubscriptionRepo.save(paidWorkspaceSubscription);
//       }

//       /*
//        * Có entitlement khác đang valid,
//        * ví dụ ADMIN_OVERRIDE,
//        * thì không ép về Free.
//        */
//       const anotherUsableSubscription = await workspaceSubscriptionRepo.findOne(
//         {
//           where: [
//             {
//               workspace: {
//                 id: billingSubscriptionWithRelations.workspace.id,
//               },

//               status: In([
//                 WorkspaceSubscriptionStatus.ACTIVE,
//                 WorkspaceSubscriptionStatus.TRIALING,
//               ]),

//               startedAt: LessThanOrEqual(fallbackAt),

//               endedAt: IsNull(),
//             },

//             {
//               workspace: {
//                 id: billingSubscriptionWithRelations.workspace.id,
//               },

//               status: In([
//                 WorkspaceSubscriptionStatus.ACTIVE,
//                 WorkspaceSubscriptionStatus.TRIALING,
//               ]),

//               startedAt: LessThanOrEqual(fallbackAt),

//               endedAt: MoreThan(fallbackAt),
//             },
//           ],

//           order: {
//             startedAt: "DESC",
//           },
//         },
//       );

//       if (anotherUsableSubscription) {
//         return;
//       }

//       await workspaceSubscriptionRepo.save(
//         workspaceSubscriptionRepo.create({
//           workspace: billingSubscriptionWithRelations.workspace,

//           plan: freePlan,

//           status: WorkspaceSubscriptionStatus.ACTIVE,

//           startedAt: fallbackAt,

//           endedAt: null,

//           trialEndsAt: null,

//           cancelledAt: null,

//           source: WorkspaceSubscriptionSource.BILLING_FALLBACK,

//           paymentTransactionId: null,

//           note: "Reverted to free plan after Stripe subscription ended",
//         }),
//       );
//     });
//   }

//   // =====================================================
//   // PAYMENT SUCCESS CORE
//   // =====================================================

//   private async applySuccessfulPayment(
//     transactionId: string,
//     input: SuccessfulPaymentInput,
//   ): Promise<PaymentTransaction> {
//     return this.paymentTransactionRepo.manager.transaction(async (manager) => {
//       const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

//       const billingSubscriptionRepo =
//         manager.getRepository(BillingSubscription);

//       /*
//        * Lock root PaymentTransaction trước.
//        * Không load relations trong query có FOR UPDATE vì TypeORM dùng
//        * LEFT JOIN và PostgreSQL sẽ báo:
//        * "FOR UPDATE cannot be applied to the nullable side of an outer join".
//        */
//       const lockedPaymentTransaction = await paymentTransactionRepo.findOne({
//         where: {
//           id: transactionId,
//         },

//         lock: {
//           mode: "pessimistic_write",
//         },
//       });

//       if (!lockedPaymentTransaction) {
//         throw new BadRequestException(
//           errorPayload(
//             "Payment transaction not found",
//             "BILLING_TRANSACTION_NOT_FOUND",
//           ),
//         );
//       }

//       /*
//        * Row lock ở trên vẫn được giữ cho tới khi transaction commit/rollback.
//        * Query này chỉ load relations để xử lý business.
//        */
//       const paymentTransaction = await paymentTransactionRepo.findOne({
//         where: {
//           id: lockedPaymentTransaction.id,
//         },

//         relations: {
//           billingSubscription: {
//             workspace: true,
//             plan: true,
//             nextPlan: true,
//           },

//           workspace: true,

//           plan: true,
//         },
//       });

//       if (!paymentTransaction) {
//         throw new BadRequestException(
//           errorPayload(
//             "Payment transaction not found",
//             "BILLING_TRANSACTION_NOT_FOUND",
//           ),
//         );
//       }

//       /*
//        * invoice.paid bị Stripe gửi lại.
//        */
//       if (paymentTransaction.status === PaymentTransactionStatus.PAID) {
//         return paymentTransaction;
//       }

//       /*
//        * Stripe có thể:
//        *
//        * FAILED → retry → PAID
//        */
//       if (
//         paymentTransaction.status !== PaymentTransactionStatus.PENDING &&
//         paymentTransaction.status !== PaymentTransactionStatus.FAILED
//       ) {
//         throw new BadRequestException(
//           errorPayload(
//             "Payment transaction cannot be marked as paid",
//             "BILLING_TRANSACTION_STATUS_INVALID",
//           ),
//         );
//       }

//       if (
//         paymentTransaction.providerTransactionRef &&
//         paymentTransaction.providerTransactionRef !==
//           input.providerTransactionRef
//       ) {
//         throw new BadRequestException(
//           errorPayload(
//             "Stripe invoice reference mismatch",
//             "BILLING_STRIPE_TRANSACTION_MISMATCH",
//           ),
//         );
//       }

//       paymentTransaction.status = PaymentTransactionStatus.PAID;

//       paymentTransaction.paidAt = input.paidAt;

//       paymentTransaction.failedAt = null;

//       paymentTransaction.failureReason = null;

//       paymentTransaction.providerTransactionRef = input.providerTransactionRef;

//       if (input.billingPeriodStart) {
//         paymentTransaction.billingPeriodStart = input.billingPeriodStart;
//       }

//       if (input.billingPeriodEnd) {
//         paymentTransaction.billingPeriodEnd = input.billingPeriodEnd;
//       }

//       if (input.amountCents !== undefined) {
//         paymentTransaction.amountCents = input.amountCents;
//       }

//       const savedTransaction =
//         await paymentTransactionRepo.save(paymentTransaction);

//       const billingSubscription = paymentTransaction.billingSubscription;

//       /*
//        * Một invoice.paid cũ đến trễ
//        * sau customer.subscription.deleted
//        * không được re-activate subscription.
//        */
//       if (
//         (billingSubscription.status === BillingSubscriptionStatus.CANCELLED ||
//           billingSubscription.status === BillingSubscriptionStatus.EXPIRED) &&
//         billingSubscription.endedAt
//       ) {
//         return savedTransaction;
//       }

//       /*
//        * Stripe invoice là source of truth của plan được charge.
//        * Nếu đây là renewal sang plan mới thì đổi current plan local
//        * chỉ sau khi invoice đã PAID.
//        */
//       billingSubscription.plan = paymentTransaction.plan;
//       billingSubscription.nextPlan = null;

//       billingSubscription.status = BillingSubscriptionStatus.ACTIVE;

//       billingSubscription.activatedAt =
//         billingSubscription.activatedAt ?? savedTransaction.paidAt;

//       billingSubscription.currentPeriodStart =
//         savedTransaction.billingPeriodStart;

//       billingSubscription.currentPeriodEnd = savedTransaction.billingPeriodEnd;

//       billingSubscription.endedAt = null;

//       await billingSubscriptionRepo.save(billingSubscription);

//       /*
//        * Tiền đã nhận
//        * → cấp/gia hạn entitlement.
//        */
//       await this.syncWorkspaceSubscription(
//         manager,
//         billingSubscription,
//         savedTransaction,
//       );

//       return savedTransaction;
//     });
//   }

//   // =====================================================
//   // PAYMENT FAILED CORE
//   // =====================================================

//   private async applyFailedPayment(
//     transactionId: string,
//     input: FailedPaymentInput,
//   ): Promise<PaymentTransaction> {
//     return this.paymentTransactionRepo.manager.transaction(async (manager) => {
//       const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

//       const billingSubscriptionRepo =
//         manager.getRepository(BillingSubscription);

//       /*
//        * Lock root PaymentTransaction trước.
//        * Không combine pessimistic lock với `relations` trên PostgreSQL.
//        */
//       const lockedPaymentTransaction = await paymentTransactionRepo.findOne({
//         where: {
//           id: transactionId,
//         },

//         lock: {
//           mode: "pessimistic_write",
//         },
//       });

//       if (!lockedPaymentTransaction) {
//         throw new BadRequestException(
//           errorPayload(
//             "Payment transaction not found",
//             "BILLING_TRANSACTION_NOT_FOUND",
//           ),
//         );
//       }

//       const paymentTransaction = await paymentTransactionRepo.findOne({
//         where: {
//           id: lockedPaymentTransaction.id,
//         },

//         relations: {
//           billingSubscription: {
//             workspace: true,

//             plan: true,
//           },

//           workspace: true,

//           plan: true,
//         },
//       });

//       if (!paymentTransaction) {
//         throw new BadRequestException(
//           errorPayload(
//             "Payment transaction not found",
//             "BILLING_TRANSACTION_NOT_FOUND",
//           ),
//         );
//       }

//       /*
//        * invoice.paid đã được xử lý.
//        * Event failed cũ đến trễ không được
//        * downgrade PAID → FAILED.
//        */
//       if (paymentTransaction.status === PaymentTransactionStatus.PAID) {
//         return paymentTransaction;
//       }

//       /*
//        * Duplicate payment_failed.
//        */
//       if (
//         paymentTransaction.status === PaymentTransactionStatus.FAILED &&
//         paymentTransaction.providerTransactionRef ===
//           input.providerTransactionRef
//       ) {
//         return paymentTransaction;
//       }

//       if (
//         paymentTransaction.providerTransactionRef &&
//         paymentTransaction.providerTransactionRef !==
//           input.providerTransactionRef
//       ) {
//         throw new BadRequestException(
//           errorPayload(
//             "Stripe invoice reference mismatch",
//             "BILLING_STRIPE_TRANSACTION_MISMATCH",
//           ),
//         );
//       }

//       paymentTransaction.status = PaymentTransactionStatus.FAILED;

//       paymentTransaction.failedAt = input.failedAt;

//       paymentTransaction.paidAt = null;

//       paymentTransaction.failureReason = input.failureReason;

//       paymentTransaction.providerTransactionRef = input.providerTransactionRef;

//       if (input.billingPeriodStart) {
//         paymentTransaction.billingPeriodStart = input.billingPeriodStart;
//       }

//       if (input.billingPeriodEnd) {
//         paymentTransaction.billingPeriodEnd = input.billingPeriodEnd;
//       }

//       if (input.amountCents !== undefined) {
//         paymentTransaction.amountCents = input.amountCents;
//       }

//       const savedTransaction =
//         await paymentTransactionRepo.save(paymentTransaction);

//       const billingSubscription = paymentTransaction.billingSubscription;

//       /*
//        * Terminal billing không đổi lại.
//        */
//       if (
//         billingSubscription.status === BillingSubscriptionStatus.CANCELLED ||
//         billingSubscription.status === BillingSubscriptionStatus.EXPIRED
//       ) {
//         return savedTransaction;
//       }

//       const isInitialUnactivated =
//         paymentTransaction.type === PaymentTransactionType.INITIAL_CHARGE &&
//         !billingSubscription.activatedAt;

//       if (isInitialUnactivated) {
//         /*
//          * Initial payment failed.
//          *
//          * Không expire ngay vì Stripe có
//          * thể retry / user có thể hoàn tất
//          * authentication sau.
//          */
//         billingSubscription.status =
//           BillingSubscriptionStatus.PENDING_ACTIVATION;

//         billingSubscription.endedAt = null;
//       } else {
//         /*
//          * Renewal payment failed.
//          */
//         billingSubscription.status = BillingSubscriptionStatus.PAST_DUE;
//       }

//       await billingSubscriptionRepo.save(billingSubscription);

//       return savedTransaction;
//     });
//   }

//   // =====================================================
//   // WORKSPACE ENTITLEMENT SYNC
//   // =====================================================

//   private async syncWorkspaceSubscription(
//     manager: EntityManager,
//     billingSubscription: BillingSubscription,
//     paymentTransaction: PaymentTransaction,
//   ): Promise<void> {
//     const workspaceSubscriptionRepo = manager.getRepository(
//       WorkspaceSubscription,
//     );

//     const activeWorkspaceSubscription =
//       await this.findCurrentWorkspaceSubscription(
//         workspaceSubscriptionRepo,
//         billingSubscription.workspace.id,
//         paymentTransaction.billingPeriodStart,
//       );

//     const isRenewingSamePaidPlan =
//       activeWorkspaceSubscription !== null &&
//       activeWorkspaceSubscription.source ===
//         WorkspaceSubscriptionSource.BILLING_PAYMENT &&
//       activeWorkspaceSubscription.plan.id === billingSubscription.plan.id;

//     if (isRenewingSamePaidPlan) {
//       await this.renewWorkspaceSubscription(
//         workspaceSubscriptionRepo,
//         activeWorkspaceSubscription,
//         paymentTransaction,
//       );

//       return;
//     }

//     if (activeWorkspaceSubscription) {
//       await this.expireWorkspaceSubscription(
//         workspaceSubscriptionRepo,
//         activeWorkspaceSubscription,
//         paymentTransaction.billingPeriodStart,
//       );
//     }

//     await this.createPaidWorkspaceSubscription(
//       workspaceSubscriptionRepo,
//       billingSubscription,
//       paymentTransaction,
//     );
//   }

//   private async findCurrentWorkspaceSubscription(
//     workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
//     workspaceId: string,
//     at: Date,
//   ): Promise<WorkspaceSubscription | null> {
//     return workspaceSubscriptionRepo.findOne({
//       where: [
//         {
//           workspace: {
//             id: workspaceId,
//           },

//           status: In([
//             WorkspaceSubscriptionStatus.ACTIVE,
//             WorkspaceSubscriptionStatus.TRIALING,
//           ]),

//           startedAt: LessThanOrEqual(at),

//           endedAt: IsNull(),
//         },

//         {
//           workspace: {
//             id: workspaceId,
//           },

//           status: In([
//             WorkspaceSubscriptionStatus.ACTIVE,
//             WorkspaceSubscriptionStatus.TRIALING,
//           ]),

//           startedAt: LessThanOrEqual(at),

//           /*
//            * Renewal thường:
//            * old endedAt === new periodStart
//            *
//            * nên cần >= chứ không phải >.
//            */
//           endedAt: MoreThanOrEqual(at),
//         },
//       ],

//       relations: {
//         workspace: true,

//         plan: true,
//       },

//       order: {
//         startedAt: "DESC",
//       },
//     });
//   }

//   private async renewWorkspaceSubscription(
//     workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
//     workspaceSubscription: WorkspaceSubscription,
//     paymentTransaction: PaymentTransaction,
//   ): Promise<void> {
//     workspaceSubscription.status = WorkspaceSubscriptionStatus.ACTIVE;

//     workspaceSubscription.endedAt = paymentTransaction.billingPeriodEnd;

//     workspaceSubscription.paymentTransactionId = paymentTransaction.id;

//     workspaceSubscription.note =
//       this.buildWorkspaceSubscriptionNote(paymentTransaction);

//     await workspaceSubscriptionRepo.save(workspaceSubscription);
//   }

//   private async expireWorkspaceSubscription(
//     workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
//     workspaceSubscription: WorkspaceSubscription,
//     endedAt: Date,
//   ): Promise<void> {
//     workspaceSubscription.status = WorkspaceSubscriptionStatus.EXPIRED;

//     workspaceSubscription.endedAt = endedAt;

//     await workspaceSubscriptionRepo.save(workspaceSubscription);
//   }

//   private async createPaidWorkspaceSubscription(
//     workspaceSubscriptionRepo: Repository<WorkspaceSubscription>,
//     billingSubscription: BillingSubscription,
//     paymentTransaction: PaymentTransaction,
//   ): Promise<void> {
//     await workspaceSubscriptionRepo.save(
//       workspaceSubscriptionRepo.create({
//         workspace: billingSubscription.workspace,

//         plan: billingSubscription.plan,

//         status: WorkspaceSubscriptionStatus.ACTIVE,

//         startedAt: paymentTransaction.billingPeriodStart,

//         endedAt: paymentTransaction.billingPeriodEnd,

//         trialEndsAt: null,

//         cancelledAt: null,

//         source: WorkspaceSubscriptionSource.BILLING_PAYMENT,

//         paymentTransactionId: paymentTransaction.id,

//         note: this.buildWorkspaceSubscriptionNote(paymentTransaction),
//       }),
//     );
//   }

//   // =====================================================
//   // STRIPE INVOICE → LOCAL TRANSACTION
//   // =====================================================

//   private async getOrCreateStripeInvoiceTransaction(
//     invoice: Stripe.Invoice,
//     billingSubscription: BillingSubscription,
//     metadata: StripeBillingMetadata,
//     amountCents: number,
//   ): Promise<PaymentTransaction> {
//     const period = this.getStripeInvoicePeriod(invoice);

//     const stripePriceId = this.getStripeInvoicePriceId(invoice);

//     const invoicePlan =
//       await this.plansService.getPlanByStripePriceIdOrThrow(stripePriceId);

//     return this.paymentTransactionRepo.manager.transaction(async (manager) => {
//       const billingSubscriptionRepo =
//         manager.getRepository(BillingSubscription);

//       const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

//       /*
//        * Serialize việc tạo transaction cho cùng billing subscription.
//        *
//        * Chỉ lock root row. Không load relations trong query FOR UPDATE
//        * vì TypeORM dùng LEFT JOIN cho `relations`, PostgreSQL không cho
//        * FOR UPDATE áp lên nullable side của outer join.
//        */
//       const lockedBillingSubscription = await billingSubscriptionRepo.findOne({
//         where: {
//           id: billingSubscription.id,
//         },

//         lock: {
//           mode: "pessimistic_write",
//         },
//       });

//       if (!lockedBillingSubscription) {
//         throw new BadRequestException(
//           errorPayload(
//             "Billing subscription not found",
//             "BILLING_SUBSCRIPTION_NOT_FOUND",
//           ),
//         );
//       }

//       /*
//        * Lock vẫn giữ trong transaction hiện tại.
//        * Load workspace + plan bằng query riêng để dùng khi tạo transaction.
//        */
//       const billingSubscriptionWithRelations =
//         await billingSubscriptionRepo.findOne({
//           where: {
//             id: lockedBillingSubscription.id,
//           },

//           relations: {
//             workspace: true,

//             plan: true,
//             nextPlan: true,
//           },
//         });

//       if (!billingSubscriptionWithRelations) {
//         throw new BadRequestException(
//           errorPayload(
//             "Billing subscription not found",
//             "BILLING_SUBSCRIPTION_NOT_FOUND",
//           ),
//         );
//       }

//       /*
//        * Invoice này đã map rồi.
//        */
//       let paymentTransaction = await paymentTransactionRepo.findOne({
//         where: {
//           provider: BillingProvider.STRIPE,

//           providerTransactionRef: invoice.id,
//         },

//         relations: {
//           billingSubscription: true,

//           workspace: true,

//           plan: true,
//         },
//       });

//       if (paymentTransaction) {
//         return paymentTransaction;
//       }

//       const isInitialInvoice = invoice.billing_reason === "subscription_create";

//       /*
//        * CHỈ initial invoice mới dùng
//        * paymentTransactionId từ metadata.
//        *
//        * Subscription metadata được copy
//        * sang các invoice renewal, nên nếu
//        * dùng ID này cho mọi invoice sẽ
//        * ghi đè transaction đầu tiên.
//        */
//       if (isInitialInvoice && metadata.paymentTransactionId) {
//         paymentTransaction = await paymentTransactionRepo.findOne({
//           where: {
//             id: metadata.paymentTransactionId,

//             billingSubscription: {
//               id: lockedBillingSubscription.id,
//             },
//           },

//           relations: {
//             billingSubscription: true,

//             workspace: true,

//             plan: true,
//           },
//         });
//       }

//       /*
//        * Fallback cho initial invoice.
//        */
//       if (!paymentTransaction && isInitialInvoice) {
//         paymentTransaction = await paymentTransactionRepo.findOne({
//           where: {
//             billingSubscription: {
//               id: lockedBillingSubscription.id,
//             },

//             provider: BillingProvider.STRIPE,

//             type: PaymentTransactionType.INITIAL_CHARGE,
//           },

//           relations: {
//             billingSubscription: true,

//             workspace: true,

//             plan: true,
//           },

//           order: {
//             createdAt: "ASC",
//           },
//         });
//       }

//       if (paymentTransaction) {
//         if (
//           paymentTransaction.providerTransactionRef &&
//           paymentTransaction.providerTransactionRef !== invoice.id
//         ) {
//           throw new BadRequestException(
//             errorPayload(
//               "Stripe invoice reference mismatch",
//               "BILLING_STRIPE_TRANSACTION_MISMATCH",
//             ),
//           );
//         }

//         paymentTransaction.providerTransactionRef = invoice.id;

//         paymentTransaction.billingPeriodStart = period.start;

//         paymentTransaction.billingPeriodEnd = period.end;

//         paymentTransaction.amountCents = amountCents;

//         return paymentTransactionRepo.save(paymentTransaction);
//       }

//       /*
//        * Không có transaction local
//        * → recurring invoice mới.
//        */
//       return paymentTransactionRepo.save(
//         paymentTransactionRepo.create({
//           billingSubscription: billingSubscriptionWithRelations,

//           workspace: billingSubscriptionWithRelations.workspace,

//           plan: invoicePlan,

//           type: isInitialInvoice
//             ? PaymentTransactionType.INITIAL_CHARGE
//             : PaymentTransactionType.RECURRING_CHARGE,

//           status: PaymentTransactionStatus.PENDING,

//           amountCents,

//           billingPeriodStart: period.start,

//           billingPeriodEnd: period.end,

//           provider: BillingProvider.STRIPE,

//           providerTransactionRef: invoice.id,

//           paidAt: null,

//           failedAt: null,

//           failureReason: null,
//         }),
//       );
//     });
//   }

//   // =====================================================
//   // STRIPE BILLING LOOKUP
//   // =====================================================

//   private async findStripeBillingSubscription(
//     metadata: StripeBillingMetadata,
//     stripeSubscriptionId: string | null,
//   ): Promise<BillingSubscription | null> {
//     let billingSubscription: BillingSubscription | null = null;

//     /*
//      * Ưu tiên internal ID trong metadata.
//      */
//     if (metadata.billingSubscriptionId) {
//       billingSubscription = await this.billingSubscriptionRepo.findOne({
//         where: {
//           id: metadata.billingSubscriptionId,

//           provider: BillingProvider.STRIPE,
//         },

//         relations: {
//           workspace: true,
//           plan: true,
//           nextPlan: true,
//         },
//       });
//     }

//     /*
//      * Fallback bằng sub_xxx.
//      */
//     if (!billingSubscription && stripeSubscriptionId) {
//       billingSubscription = await this.billingSubscriptionRepo.findOne({
//         where: {
//           provider: BillingProvider.STRIPE,

//           providerSubscriptionRef: stripeSubscriptionId,
//         },

//         relations: {
//           workspace: true,
//           plan: true,
//           nextPlan: true,
//         },
//       });
//     }

//     if (!billingSubscription) {
//       return null;
//     }

//     /*
//      * Metadata consistency checks.
//      */
//     if (
//       metadata.workspaceId &&
//       metadata.workspaceId !== billingSubscription.workspace.id
//     ) {
//       throw new BadRequestException(
//         errorPayload(
//           "Stripe workspace metadata mismatch",
//           "BILLING_STRIPE_WORKSPACE_MISMATCH",
//         ),
//       );
//     }

//     if (stripeSubscriptionId) {
//       if (
//         billingSubscription.providerSubscriptionRef &&
//         billingSubscription.providerSubscriptionRef !== stripeSubscriptionId
//       ) {
//         throw new BadRequestException(
//           errorPayload(
//             "Stripe subscription reference mismatch",
//             "BILLING_STRIPE_SUBSCRIPTION_MISMATCH",
//           ),
//         );
//       }

//       /*
//        * invoice.paid có thể đến trước
//        * checkout.session.completed.
//        */
//       if (!billingSubscription.providerSubscriptionRef) {
//         await this.billingSubscriptionRepo.update(billingSubscription.id, {
//           providerSubscriptionRef: stripeSubscriptionId,
//         });

//         billingSubscription.providerSubscriptionRef = stripeSubscriptionId;
//       }
//     }

//     return billingSubscription;
//   }

//   // =====================================================
//   // STRIPE INVOICE HELPERS
//   // =====================================================

//   private getStripeInvoiceMetadata(
//     invoice: Stripe.Invoice,
//   ): StripeBillingMetadata {
//     /*
//      * Stripe API mới:
//      *
//      * invoice.parent.subscription_details.metadata
//      */
//     const typedInvoice = invoice as unknown as {
//       parent?: {
//         type?: string;

//         subscription_details?: {
//           metadata?: Record<string, string> | null;
//         } | null;
//       } | null;

//       /*
//        * Compatibility với SDK/API cũ.
//        */
//       subscription_details?: {
//         metadata?: Record<string, string> | null;
//       } | null;
//     };

//     const parentMetadata = typedInvoice.parent?.subscription_details?.metadata;

//     if (parentMetadata) {
//       return parentMetadata as StripeBillingMetadata;
//     }

//     return (typedInvoice.subscription_details?.metadata ??
//       {}) as StripeBillingMetadata;
//   }

//   private getStripeInvoiceSubscriptionId(
//     invoice: Stripe.Invoice,
//   ): string | null {
//     const typedInvoice = invoice as unknown as {
//       parent?: {
//         type?: string;

//         subscription_details?: {
//           subscription?:
//             | string
//             | {
//                 id: string;
//               }
//             | null;
//         } | null;
//       } | null;

//       /*
//        * Compatibility SDK/API cũ.
//        */
//       subscription?:
//         | string
//         | {
//             id: string;
//           }
//         | null;
//     };

//     const parentSubscription =
//       typedInvoice.parent?.subscription_details?.subscription;

//     if (parentSubscription) {
//       return this.getStripeObjectId(parentSubscription);
//     }

//     return this.getStripeObjectId(typedInvoice.subscription);
//   }

//   private getStripeInvoicePeriod(invoice: Stripe.Invoice): {
//     start: Date;
//     end: Date;
//   } {
//     /*
//      * Ưu tiên subscription line.
//      */
//     const subscriptionLine =
//       invoice.lines.data.find((line) => {
//         const typedLine = line as unknown as {
//           parent?: {
//             type?: string;
//           } | null;
//         };

//         return typedLine.parent?.type === "subscription_item_details";
//       }) ?? invoice.lines.data[0];

//     if (!subscriptionLine) {
//       throw new BadRequestException(
//         errorPayload(
//           "Stripe invoice does not contain a billing period",
//           "BILLING_STRIPE_INVOICE_PERIOD_MISSING",
//         ),
//       );
//     }

//     return {
//       start: new Date(subscriptionLine.period.start * 1000),

//       end: new Date(subscriptionLine.period.end * 1000),
//     };
//   }

//   private getStripeInvoicePriceId(
//     invoice: Stripe.Invoice,
//   ): string {
//     const subscriptionLine =
//       invoice.lines.data.find((line) => {
//         const typedLine = line as unknown as {
//           parent?: {
//             type?: string;
//           } | null;
//         };

//         return typedLine.parent?.type === "subscription_item_details";
//       }) ?? invoice.lines.data[0];

//     if (!subscriptionLine) {
//       throw new BadRequestException(
//         errorPayload(
//           "Stripe invoice does not contain a subscription line",
//           "BILLING_STRIPE_INVOICE_PRICE_MISSING",
//         ),
//       );
//     }

//     const typedLine = subscriptionLine as unknown as {
//       pricing?: {
//         price_details?: {
//           price?: string | null;
//         } | null;
//       } | null;

//       price?:
//         | {
//             id: string;
//           }
//         | null;
//     };

//     const stripePriceId =
//       typedLine.pricing?.price_details?.price ??
//       typedLine.price?.id ??
//       null;

//     if (!stripePriceId) {
//       throw new BadRequestException(
//         errorPayload(
//           "Stripe invoice price ID is missing",
//           "BILLING_STRIPE_INVOICE_PRICE_MISSING",
//         ),
//       );
//     }

//     return stripePriceId;
//   }

//   private getStripeObjectId(
//     value:
//       | string
//       | {
//           id: string;
//         }
//       | null
//       | undefined,
//   ): string | null {
//     if (!value) {
//       return null;
//     }

//     return typeof value === "string" ? value : value.id;
//   }

//   // =====================================================
//   // START FAILURE
//   // =====================================================

//   private async failStripeCheckoutInitialization(
//     billingSubscriptionId: string,
//     paymentTransactionId: string,
//   ): Promise<void> {
//     const failedAt = new Date();

//     await this.billingSubscriptionRepo.manager.transaction(async (manager) => {
//       const billingSubscriptionRepo =
//         manager.getRepository(BillingSubscription);

//       const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

//       const billingSubscription = await billingSubscriptionRepo.findOne({
//         where: {
//           id: billingSubscriptionId,
//         },
//       });

//       const paymentTransaction = await paymentTransactionRepo.findOne({
//         where: {
//           id: paymentTransactionId,
//         },
//       });

//       if (
//         paymentTransaction &&
//         paymentTransaction.status === PaymentTransactionStatus.PENDING
//       ) {
//         paymentTransaction.status = PaymentTransactionStatus.FAILED;

//         paymentTransaction.failedAt = failedAt;

//         paymentTransaction.failureReason =
//           "Unable to create Stripe Checkout Session";

//         await paymentTransactionRepo.save(paymentTransaction);
//       }

//       if (
//         billingSubscription &&
//         billingSubscription.status ===
//           BillingSubscriptionStatus.PENDING_ACTIVATION
//       ) {
//         billingSubscription.status = BillingSubscriptionStatus.EXPIRED;

//         billingSubscription.endedAt = failedAt;

//         await billingSubscriptionRepo.save(billingSubscription);
//       }
//     });
//   }

//   // =====================================================
//   // GENERAL HELPERS
//   // =====================================================

//   private async getOpenBillingSubscription(
//     workspaceId: string,
//   ): Promise<BillingSubscription | null> {
//     return this.billingSubscriptionRepo.findOne({
//       where: {
//         workspace: {
//           id: workspaceId,
//         },

//         endedAt: IsNull(),
//       },

//       relations: {
//         plan: true,
//       },

//       order: {
//         createdAt: "DESC",
//       },
//     });
//   }

//   private async getBillablePlanAndPrice(planCode: string) {
//     const normalizedPlanCode = planCode.trim().toLowerCase();

//     const plan =
//       await this.plansService.getPlanByCodeOrThrow(normalizedPlanCode);

//     if (!plan.isPublic) {
//       throw new BadRequestException(
//         errorPayload("Billing plan not found", "BILLING_PLAN_NOT_FOUND"),
//       );
//     }

//     const price = await this.plansService.getActivePriceOrThrow(
//       plan.code,
//       this.billingCurrency,
//       this.billingInterval,
//     );

//     if (!Number.isFinite(price.amount) || price.amount <= 0) {
//       throw new BadRequestException(
//         errorPayload(
//           "Selected plan is not billable",
//           "BILLING_PLAN_NOT_BILLABLE",
//         ),
//       );
//     }

//     if (!price.stripePriceId) {
//       throw new BadRequestException(
//         errorPayload(
//           "Stripe price is not configured for selected plan",
//           "BILLING_STRIPE_PRICE_NOT_CONFIGURED",
//         ),
//       );
//     }

//     return {
//       plan,
//       price,
//     };
//   }

//   private async getBillablePriceForPlan(planCode: string) {
//     const { price } = await this.getBillablePlanAndPrice(planCode);

//     return price;
//   }

//   private async getOwnedWorkspaceOrThrow(userId: string): Promise<Workspace> {
//     const workspace = await this.workspaceRepo.findOne({
//       where: {
//         owner: {
//           id: userId,
//         },
//       },
//     });

//     if (!workspace) {
//       throw new BadRequestException(
//         errorPayload(
//           "Current workspace not found",
//           "WORKSPACE_CURRENT_NOT_FOUND",
//         ),
//       );
//     }

//     return workspace;
//   }

//   private buildWorkspaceSubscriptionNote(
//     paymentTransaction: PaymentTransaction,
//   ): string {
//     if (paymentTransaction.type === PaymentTransactionType.RECURRING_CHARGE) {
//       return (
//         `Renewed ` +
//         `${paymentTransaction.plan.code} ` +
//         `plan from Stripe payment`
//       );
//     }

//     return (
//       `Activated ` +
//       `${paymentTransaction.plan.code} ` +
//       `plan from Stripe payment`
//     );
//   }

//   private addMonths(date: Date, months: number): Date {
//     const nextDate = new Date(date);

//     nextDate.setMonth(nextDate.getMonth() + months);

//     return nextDate;
//   }
// }

import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { errorPayload } from "src/common/utils/error-payload.util";

import { PlansService } from "src/plans/plans.service";
import { PlanBillingInterval } from "src/plans/entities/plan-price.entity";

import { Workspace } from "src/workspaces/entities/workspace.entity";

import {
  BillingCycle,
  BillingProvider,
  BillingSubscription,
  BillingSubscriptionStatus,
} from "./entities/billing-subscription.entity";

import {
  PaymentTransaction,
  PaymentTransactionStatus,
  PaymentTransactionType,
} from "./entities/payment-transaction.entity";

import { StripeService } from "./stripe/stripe.service";

@Injectable()
export class BillingService {
  private readonly billingCurrency = "USD";

  private readonly billingInterval = PlanBillingInterval.MONTHLY;

  constructor(
    @InjectRepository(BillingSubscription)
    private readonly billingSubscriptionRepo: Repository<BillingSubscription>,

    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepo: Repository<PaymentTransaction>,

    @InjectRepository(Workspace)
    private readonly workspaceRepo: Repository<Workspace>,

    private readonly plansService: PlansService,

    private readonly stripeService: StripeService,
  ) {}

  async startMyWorkspacePlanSubscription(
    userId: string,
    planCode: string,
  ): Promise<{
    sessionId: string;
    checkoutUrl: string;
  }> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);

    const { plan, price } = await this.getBillablePlanAndPrice(planCode);

    const currentBillingSubscription = await this.getOpenBillingSubscription(
      workspace.id,
    );

    if (currentBillingSubscription) {
      if (
        currentBillingSubscription.status ===
          BillingSubscriptionStatus.ACTIVE &&
        currentBillingSubscription.plan.id === plan.id
      ) {
        throw new BadRequestException(
          errorPayload(
            "Workspace is already subscribed to this plan",
            "BILLING_ALREADY_SUBSCRIBED_TO_PLAN",
          ),
        );
      }

      throw new BadRequestException(
        errorPayload(
          "Workspace already has a billing subscription",
          "BILLING_SUBSCRIPTION_ALREADY_EXISTS",
        ),
      );
    }

    /*
     * Chỉ là provisional period vì Stripe
     * chưa tạo subscription thật.
     *
     * invoice.paid / payment_failed sẽ
     * overwrite bằng period thật của Stripe.
     */
    const provisionalPeriodStart = new Date();

    const provisionalPeriodEnd = this.addMonths(provisionalPeriodStart, 1);

    const { billingSubscription, paymentTransaction } =
      await this.billingSubscriptionRepo.manager.transaction(
        async (manager) => {
          const billingSubscriptionRepo =
            manager.getRepository(BillingSubscription);

          const paymentTransactionRepo =
            manager.getRepository(PaymentTransaction);

          /*
           * Local billing tồn tại trước Checkout.
           * Chưa thanh toán nên chưa ACTIVE.
           */
          const billingSubscription = await billingSubscriptionRepo.save(
            billingSubscriptionRepo.create({
              workspace,
              plan,
              nextPlan: null,

              status: BillingSubscriptionStatus.PENDING_ACTIVATION,

              provider: BillingProvider.STRIPE,

              /*
               * checkout.session.completed
               * sẽ ghi sub_xxx vào đây.
               */
              providerSubscriptionRef: null,

              billingCycle: BillingCycle.MONTHLY,

              activatedAt: null,

              currentPeriodStart: null,

              currentPeriodEnd: null,

              cancelAtPeriodEnd: false,

              cancelledAt: null,

              endedAt: null,
            }),
          );

          /*
           * Payment attempt đầu tiên.
           */
          const paymentTransaction = await paymentTransactionRepo.save(
            paymentTransactionRepo.create({
              billingSubscription,

              workspace,
              plan,

              type: PaymentTransactionType.INITIAL_CHARGE,

              status: PaymentTransactionStatus.PENDING,

              amountCents: price.amount,

              billingPeriodStart: provisionalPeriodStart,

              billingPeriodEnd: provisionalPeriodEnd,

              provider: BillingProvider.STRIPE,

              providerTransactionRef: null,

              paidAt: null,

              failedAt: null,

              failureReason: null,
            }),
          );

          return {
            billingSubscription,
            paymentTransaction,
          };
        },
      );

    try {
      return await this.stripeService.createSubscriptionCheckoutSession({
        workspaceId: workspace.id,
        planId: plan.id,
        planCode: plan.code,
        planPriceId: price.id,
        billingSubscriptionId: billingSubscription.id,
        paymentTransactionId: paymentTransaction.id,
        stripePriceId: price.stripePriceId!,
      });
    } catch (error) {
      await this.failStripeCheckoutInitialization(
        billingSubscription.id,
        paymentTransaction.id,
      );

      throw error;
    }
  }

  async getMyBillingSubscription(
    userId: string,
  ): Promise<BillingSubscription | null> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);

    return this.getCurrentBillingSubscription(workspace.id);
  }

  async getCurrentBillingSubscription(
    workspaceId: string,
  ): Promise<BillingSubscription | null> {
    return this.billingSubscriptionRepo.findOne({
      where: {
        workspace: {
          id: workspaceId,
        },

        endedAt: IsNull(),
      },

      relations: {
        workspace: true,

        plan: {
          features: true,
          prices: true,
        },

        nextPlan: {
          features: true,
          prices: true,
        },
      },

      order: {
        createdAt: "DESC",
      },
    });
  }

  async changeMyBillingPlan(
    userId: string,
    targetPlanCode: string,
  ): Promise<BillingSubscription> {
    const workspace = await this.getOwnedWorkspaceOrThrow(userId);

    const billingSubscription = await this.billingSubscriptionRepo.findOne({
      where: {
        workspace: {
          id: workspace.id,
        },

        endedAt: IsNull(),
      },

      relations: {
        workspace: true,

        plan: {
          features: true,
          prices: true,
        },

        nextPlan: {
          features: true,
          prices: true,
        },
      },

      order: {
        createdAt: "DESC",
      },
    });

    if (!billingSubscription) {
      throw new BadRequestException(
        errorPayload(
          "Billing subscription not found. Start a paid subscription first.",
          "BILLING_SUBSCRIPTION_NOT_FOUND",
        ),
      );
    }

    if (
      billingSubscription.provider !== BillingProvider.STRIPE ||
      !billingSubscription.providerSubscriptionRef
    ) {
      throw new BadRequestException(
        errorPayload(
          "Stripe subscription reference is missing",
          "BILLING_STRIPE_SUBSCRIPTION_REF_MISSING",
        ),
      );
    }

    const normalizedTargetPlanCode = targetPlanCode.trim().toLowerCase();

    if (normalizedTargetPlanCode === "free") {
      if (
        billingSubscription.status !== BillingSubscriptionStatus.ACTIVE &&
        billingSubscription.status !== BillingSubscriptionStatus.PAST_DUE
      ) {
        throw new BadRequestException(
          errorPayload(
            "Billing subscription cannot be cancelled",
            "BILLING_SUBSCRIPTION_STATUS_INVALID",
          ),
        );
      }

      if (billingSubscription.cancelAtPeriodEnd) {
        throw new BadRequestException(
          errorPayload(
            "Billing subscription is already scheduled to cancel at period end",
            "BILLING_CANCELLATION_ALREADY_SCHEDULED",
          ),
        );
      }

      const currentPrice = await this.getBillablePriceForPlan(
        billingSubscription.plan.code,
      );

      const stripeSubscription =
        await this.stripeService.configureSubscriptionRenewal({
          subscriptionId: billingSubscription.providerSubscriptionRef,

          stripePriceId: currentPrice.stripePriceId!,

          cancelAtPeriodEnd: true,
        });

      billingSubscription.nextPlan = null;

      billingSubscription.cancelAtPeriodEnd =
        stripeSubscription.cancel_at_period_end;

      billingSubscription.cancelledAt = new Date();

      return this.billingSubscriptionRepo.save(billingSubscription);
    }

    if (billingSubscription.status !== BillingSubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        errorPayload(
          "Only active billing subscriptions can change plan",
          "BILLING_SUBSCRIPTION_STATUS_INVALID",
        ),
      );
    }

    const { plan: targetPlan, price: targetPrice } =
      await this.getBillablePlanAndPrice(normalizedTargetPlanCode);
    if (targetPlan.id === billingSubscription.plan.id) {
      const hasPendingPlanChange = billingSubscription.nextPlan !== null;

      const hasPendingCancellation = billingSubscription.cancelAtPeriodEnd;

      if (!hasPendingPlanChange && !hasPendingCancellation) {
        throw new BadRequestException(
          errorPayload(
            "Workspace is already subscribed to this plan",
            "BILLING_ALREADY_SUBSCRIBED_TO_PLAN",
          ),
        );
      }

      const stripeSubscription =
        await this.stripeService.configureSubscriptionRenewal({
          subscriptionId: billingSubscription.providerSubscriptionRef,

          stripePriceId: targetPrice.stripePriceId!,

          cancelAtPeriodEnd: false,
        });

      billingSubscription.nextPlan = null;

      billingSubscription.cancelAtPeriodEnd =
        stripeSubscription.cancel_at_period_end;

      billingSubscription.cancelledAt = null;

      return this.billingSubscriptionRepo.save(billingSubscription);
    }

    if (billingSubscription.nextPlan?.id === targetPlan.id) {
      throw new BadRequestException(
        errorPayload(
          "This plan change is already scheduled for the next billing period",
          "BILLING_PLAN_CHANGE_ALREADY_SCHEDULED",
        ),
      );
    }

    const stripeSubscription =
      await this.stripeService.configureSubscriptionRenewal({
        subscriptionId: billingSubscription.providerSubscriptionRef,

        stripePriceId: targetPrice.stripePriceId!,

        cancelAtPeriodEnd: false,
      });

    billingSubscription.nextPlan = targetPlan;

    billingSubscription.cancelAtPeriodEnd =
      stripeSubscription.cancel_at_period_end;

    billingSubscription.cancelledAt = null;

    return this.billingSubscriptionRepo.save(billingSubscription);
  }

  async cancelMyBillingSubscription(
    userId: string,
  ): Promise<BillingSubscription> {
    return this.changeMyBillingPlan(userId, "free");
  }

  private async failStripeCheckoutInitialization(
    billingSubscriptionId: string,
    paymentTransactionId: string,
  ): Promise<void> {
    const failedAt = new Date();

    await this.billingSubscriptionRepo.manager.transaction(async (manager) => {
      const billingSubscriptionRepo =
        manager.getRepository(BillingSubscription);

      const paymentTransactionRepo = manager.getRepository(PaymentTransaction);

      const billingSubscription = await billingSubscriptionRepo.findOne({
        where: {
          id: billingSubscriptionId,
        },
      });

      const paymentTransaction = await paymentTransactionRepo.findOne({
        where: {
          id: paymentTransactionId,
        },
      });

      if (
        paymentTransaction &&
        paymentTransaction.status === PaymentTransactionStatus.PENDING
      ) {
        paymentTransaction.status = PaymentTransactionStatus.FAILED;

        paymentTransaction.failedAt = failedAt;

        paymentTransaction.failureReason =
          "Unable to create Stripe Checkout Session";

        await paymentTransactionRepo.save(paymentTransaction);
      }

      if (
        billingSubscription &&
        billingSubscription.status ===
          BillingSubscriptionStatus.PENDING_ACTIVATION
      ) {
        billingSubscription.status = BillingSubscriptionStatus.EXPIRED;

        billingSubscription.endedAt = failedAt;

        await billingSubscriptionRepo.save(billingSubscription);
      }
    });
  }

  private async getOpenBillingSubscription(
    workspaceId: string,
  ): Promise<BillingSubscription | null> {
    return this.billingSubscriptionRepo.findOne({
      where: {
        workspace: {
          id: workspaceId,
        },

        endedAt: IsNull(),
      },

      relations: {
        plan: true,
      },

      order: {
        createdAt: "DESC",
      },
    });
  }

  private async getBillablePlanAndPrice(planCode: string) {
    const normalizedPlanCode = planCode.trim().toLowerCase();

    const plan =
      await this.plansService.getPlanByCodeOrThrow(normalizedPlanCode);

    if (!plan.isPublic) {
      throw new BadRequestException(
        errorPayload("Billing plan not found", "BILLING_PLAN_NOT_FOUND"),
      );
    }

    const price = await this.plansService.getActivePriceOrThrow(
      plan.code,
      this.billingCurrency,
      this.billingInterval,
    );

    if (!Number.isFinite(price.amount) || price.amount <= 0) {
      throw new BadRequestException(
        errorPayload(
          "Selected plan is not billable",
          "BILLING_PLAN_NOT_BILLABLE",
        ),
      );
    }

    if (!price.stripePriceId) {
      throw new BadRequestException(
        errorPayload(
          "Stripe price is not configured for selected plan",
          "BILLING_STRIPE_PRICE_NOT_CONFIGURED",
        ),
      );
    }

    return {
      plan,
      price,
    };
  }

  private async getBillablePriceForPlan(planCode: string) {
    const { price } = await this.getBillablePlanAndPrice(planCode);

    return price;
  }

  private async getOwnedWorkspaceOrThrow(userId: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findOne({
      where: {
        owner: {
          id: userId,
        },
      },
    });

    if (!workspace) {
      throw new BadRequestException(
        errorPayload(
          "Current workspace not found",
          "WORKSPACE_CURRENT_NOT_FOUND",
        ),
      );
    }

    return workspace;
  }

  private addMonths(date: Date, months: number): Date {
    const nextDate = new Date(date);

    nextDate.setMonth(nextDate.getMonth() + months);

    return nextDate;
  }
}
