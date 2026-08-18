import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from "@nestjs/common";

import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";

import { StripeService } from "./stripe.service";
import { StripeWebhookService } from "./stripe-webhook.service";

@Controller("billing/stripe")
export class StripeWebhookController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly stripeWebhookService: StripeWebhookService,
  ) {}

  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature?: string,
  ): Promise<{ received: true }> {
    if (!signature) {
      throw new BadRequestException("Missing Stripe signature");
    }

    if (!req.rawBody) {
      throw new BadRequestException("Missing raw request body");
    }

    const event = this.stripeService.constructWebhookEvent(
      req.rawBody,
      signature,
    );

    await this.stripeWebhookService.handleStripeWebhook(event);

    return {
      received: true,
    };
  }
}