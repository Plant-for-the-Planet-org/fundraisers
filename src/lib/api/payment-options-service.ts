import type { PaymentOptions } from '@/lib/types/payment-options';
import { platformAPIClient } from './external-client';

export async function getPaymentOptions(
  fundraiserId: string
): Promise<PaymentOptions> {
  return platformAPIClient.get<PaymentOptions>(
    `/paymentOptions/${fundraiserId}`
  );
}
