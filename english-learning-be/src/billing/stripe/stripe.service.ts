import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;

  private readonly frontendUrl: string;

  private readonly webhookSecret: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService
      .get<string>("STRIPE_SECRET_KEY")
      ?.trim();

    const frontendUrl = this.configService.get<string>("FRONTEND_URL")?.trim();

    const webhookSecret = this.configService
      .get<string>("STRIPE_WEBHOOK_SECRET")
      ?.trim();

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not configured");
    }

    this.stripe = new Stripe(secretKey);

    this.frontendUrl = frontendUrl;

    this.webhookSecret = webhookSecret;
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret,
    );
  }

  /*
   * Free -> Paid:
   * dùng fixed Stripe Price ID thay vì price_data.
   */
  async createSubscriptionCheckoutSession(input: {
    workspaceId: string;

    planId: string;
    planCode: string;
    planPriceId: string;

    billingSubscriptionId: string;
    paymentTransactionId: string;

    stripePriceId: string;
  }): Promise<{
    sessionId: string;
    checkoutUrl: string;
  }> {
    const metadata = {
      workspaceId: input.workspaceId,

      planId: input.planId,

      planCode: input.planCode,

      planPriceId: input.planPriceId,

      billingSubscriptionId: input.billingSubscriptionId,

      paymentTransactionId: input.paymentTransactionId,
    };

    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "subscription",

        line_items: [
          {
            price: input.stripePriceId,

            quantity: 1,
          },
        ],

        success_url:
          `${this.frontendUrl}/billing/success` +
          "?session_id={CHECKOUT_SESSION_ID}",

        cancel_url: `${this.frontendUrl}/billing` + "?checkout=cancelled",

        client_reference_id: input.paymentTransactionId,

        metadata,

        subscription_data: {
          metadata,
        },
      },

      {
        idempotencyKey: `checkout-${input.paymentTransactionId}`,
      },
    );

    if (!session.url) {
      throw new InternalServerErrorException(
        "Stripe did not return a checkout URL",
      );
    }

    return {
      sessionId: session.id,

      checkoutUrl: session.url,
    };
  }

  async configureSubscriptionRenewal(input: {
    subscriptionId: string;
    stripePriceId: string;
    cancelAtPeriodEnd: boolean;
  }): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.retrieve(
      input.subscriptionId,
    );

    const items = subscription.items.data;

    if (items.length !== 1) {
      throw new InternalServerErrorException(
        "Expected Stripe subscription to contain exactly one recurring item",
      );
    }

    const currentItem = items[0];

    return this.stripe.subscriptions.update(input.subscriptionId, {
      items: [
        {
          id: currentItem.id,

          price: input.stripePriceId,

          quantity: 1,
        },
      ],

      proration_behavior: "none",

      cancel_at_period_end: input.cancelAtPeriodEnd,
    });
  }
}
