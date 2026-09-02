import type {
  PaymentOptions,
  ProjectPaymentOptions,
} from '@/lib/types/payment-options';

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

/**
 * Loads a project together with its payment options. Throws a
 * `PlatformAPIError` with status 404 when the slug matches no visible project.
 */
export async function getProjectPaymentOptions(
  projectSlug: string,
  options: GetPaymentOptionsParams = {}
): Promise<ProjectPaymentOptions> {
  return platformFetch<ProjectPaymentOptions>(
    `/paymentOptions/${encodeURIComponent(projectSlug)}`,
    { token: options.token }
  );
}
