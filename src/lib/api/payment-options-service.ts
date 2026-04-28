import type { PaymentOptions } from '@/lib/types/payment-options';

import { platformAPIClient } from './external-client';

export async function getPaymentOptions(
  fundraiserId: string,
  token?: string
): Promise<PaymentOptions> {
  return token
    ? platformAPIClient.getAuthenticated<PaymentOptions>(
        `/paymentOptions/${fundraiserId}`,
        token
      )
    : platformAPIClient.get<PaymentOptions>(`/paymentOptions/${fundraiserId}`);
}
