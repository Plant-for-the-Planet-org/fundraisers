import type { PaymentOptions } from '@/lib/types/payment-options';

import { platformFetch } from './platform-fetch';

interface GetPaymentOptionsParams {
  token?: string;
}

export async function getPaymentOptions(
  fundraiserId: string,
  options: GetPaymentOptionsParams = {}
): Promise<PaymentOptions> {
  return platformFetch<PaymentOptions>(`/paymentOptions/${fundraiserId}`, {
    token: options.token,
  });
}
