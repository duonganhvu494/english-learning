import { httpClient } from "@/api/core/http-client";
import type {
  BillingSubscription,
  MarkPaymentFailedRequest,
  PaymentTransaction,
  StartBillingSubscriptionRequest,
  StartBillingSubscriptionResponse,
} from "@/types/billing";

export const billingApi = {
  getMySubscription: () =>
    httpClient.get<BillingSubscription | null>("/billing/me/subscription"),
  startSubscription: (payload: StartBillingSubscriptionRequest) =>
    httpClient.post<StartBillingSubscriptionResponse>(
      "/billing/me/subscription",
      payload,
    ),
  payMockTransaction: (transactionId: string) =>
    httpClient.post<PaymentTransaction>(
      `/billing/mock/transactions/${transactionId}/pay`,
    ),
  failMockTransaction: (
    transactionId: string,
    payload: MarkPaymentFailedRequest = {},
  ) =>
    httpClient.post<PaymentTransaction>(
      `/billing/mock/transactions/${transactionId}/fail`,
      payload,
    ),
  cancelSubscription: () =>
    httpClient.post<BillingSubscription>("/billing/me/subscription/cancel"),
};
