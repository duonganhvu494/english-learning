import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly testPriceId: string;
  private readonly frontendUrl: string;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService
      .get<string>("STRIPE_SECRET_KEY")
      ?.trim();

    const testPriceId = this.configService
      .get<string>("STRIPE_TEST_PRICE_ID")
      ?.trim();

    const frontendUrl = this.configService.get<string>("FRONTEND_URL")?.trim();

    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!testPriceId) {
      throw new Error("STRIPE_TEST_PRICE_ID is not configured");
    }

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not configured");
    }

    this.stripe = new Stripe(secretKey);
    this.testPriceId = testPriceId;
    this.frontendUrl = frontendUrl;
  }

  async createSubscriptionCheckoutSession(input: {
    workspaceId: string;
    planCode: string;
  }): Promise<{
    sessionId: string;
    checkoutUrl: string;
  }> {
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: this.testPriceId,
          quantity: 1,
        },
      ],

      success_url:
        `${this.frontendUrl}/billing/success` +
        "?session_id={CHECKOUT_SESSION_ID}",

      cancel_url: `${this.frontendUrl}/billing?checkout=cancelled`,

      client_reference_id: input.workspaceId,

      metadata: {
        workspaceId: input.workspaceId,
        planCode: input.planCode,
      },

      subscription_data: {
        metadata: {
          workspaceId: input.workspaceId,
          planCode: input.planCode,
        },
      },
    });

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
}
