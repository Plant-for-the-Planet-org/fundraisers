import type { PaymentOptions } from '@/lib/types/payment-options';

import { platformAPIClient } from './external-client';

interface GetPaymentOptionsParams {
  token?: string;
}

export async function getPaymentOptions(
  fundraiserId: string,
  options: GetPaymentOptionsParams = {}
): Promise<PaymentOptions> {
  return options.token
    ? platformAPIClient.getAuthenticated<PaymentOptions>(
        `/paymentOptions/${fundraiserId}`,
        options.token
      )
    : platformAPIClient.get<PaymentOptions>(`/paymentOptions/${fundraiserId}`);
}
