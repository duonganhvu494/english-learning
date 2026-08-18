import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { PlansModule } from "src/plans/plans.module";

import { Workspace } from "src/workspaces/entities/workspace.entity";

import { BillingSubscription } from "./entities/billing-subscription.entity";
import { PaymentTransaction } from "./entities/payment-transaction.entity";

import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";

import { BillingPaymentService } from "./billing-payment.service";

import { StripeService } from "./stripe/stripe.service";
import { StripeWebhookController } from "./stripe/stripe-webhook.controller";
import { StripeWebhookService } from "./stripe/stripe-webhook.service";

@Module({
  imports: [
    PlansModule,

    TypeOrmModule.forFeature([
      BillingSubscription,
      PaymentTransaction,
      Workspace,
    ]),
  ],

  controllers: [BillingController, StripeWebhookController],

  providers: [
    BillingService,
    BillingPaymentService,
    StripeService,
    StripeWebhookService,
  ],

  exports: [TypeOrmModule, BillingService],
})
export class BillingModule {}
