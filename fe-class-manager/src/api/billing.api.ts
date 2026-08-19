import type {
  BillingSubscriptionResponse,
  ChangeBillingPlanDto,
  StartBillingSubscriptionDto,
  StartBillingSubscriptionResponse,
} from "@/types";

import { authApi } from "./auth.api";
import { http, unwrap } from "./http";

export const billingApi = {
  async getMySubscription(): Promise<
    BillingSubscriptionResponse | null
  > {
    return unwrap<BillingSubscriptionResponse | null>(
      http.get("/billing/me/subscription"),
    );
  },

  async startSubscription(
    payload: StartBillingSubscriptionDto,
  ): Promise<StartBillingSubscriptionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<StartBillingSubscriptionResponse>(
      http.post(
        "/billing/me/subscription",
        payload,
      ),
    );
  },

  async changePlan(
    payload: ChangeBillingPlanDto,
  ): Promise<BillingSubscriptionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<BillingSubscriptionResponse>(
      http.patch(
        "/billing/me/subscription/plan",
        payload,
      ),
    );
  },

  async cancelSubscription(): Promise<BillingSubscriptionResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<BillingSubscriptionResponse>(
      http.post(
        "/billing/me/subscription/cancel",
      ),
    );
  },
};