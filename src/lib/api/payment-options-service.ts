import type { PaymentOptions } from '@/lib/types/payment-options';

import { platformAPIClient } from './external-client';

interface GetPaymentOptionsOptions {
  token?: string | null;
}

export async function getPaymentOptions(
  fundraiserId: string,
  options: GetPaymentOptionsOptions = {}
): Promise<PaymentOptions> {
  return options.token
    ? platformAPIClient.getAuthenticated<PaymentOptions>(
        `/paymentOptions/${fundraiserId}`,
        options.token
      )
    : platformAPIClient.get<PaymentOptions>(`/paymentOptions/${fundraiserId}`);
}
