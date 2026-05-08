import type {
  BillingSubscriptionResponse,
  MarkPaymentFailedDto,
  PaymentTransactionResponse,
  StartBillingSubscriptionDto,
  StartBillingSubscriptionResponse,
} from '@/types';
import { authApi } from './auth.api';
import { http, unwrap } from './http';

export const billingApi = {
  async getMySubscription(): Promise<BillingSubscriptionResponse | null> {
    return unwrap<BillingSubscriptionResponse | null>(
      http.get('/billing/me/subscription'),
    );
  },

  async startSubscription(
    payload: StartBillingSubscriptionDto,
  ): Promise<StartBillingSubscriptionResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<StartBillingSubscriptionResponse>(
      http.post('/billing/me/subscription', payload),
    );
  },

  async cancelSubscription(): Promise<BillingSubscriptionResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<BillingSubscriptionResponse>(
      http.post('/billing/me/subscription/cancel'),
    );
  },

  async payMockTransaction(
    transactionId: string,
  ): Promise<PaymentTransactionResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<PaymentTransactionResponse>(
      http.post(`/billing/mock/transactions/${transactionId}/pay`),
    );
  },

  async failMockTransaction(
    transactionId: string,
    payload: MarkPaymentFailedDto,
  ): Promise<PaymentTransactionResponse> {
    await authApi.ensureCsrfToken();
    return unwrap<PaymentTransactionResponse>(
      http.post(`/billing/mock/transactions/${transactionId}/fail`, payload),
    );
  },
};
