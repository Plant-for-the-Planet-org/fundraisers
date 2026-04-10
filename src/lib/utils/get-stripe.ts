import type { Stripe, StripeElementLocale } from '@stripe/stripe-js';

import { loadStripe } from '@stripe/stripe-js';

// Cache is unbounded but practically small — one entry per publishable key + locale pair.
// No eviction needed. Failed loads are removed so they can be retried.
const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

export function getStripe(
  publishableKey: string,
  locale: string
): Promise<Stripe | null> {
  const cacheKey = `${publishableKey}-${locale}`;
  const cached = stripePromiseCache.get(cacheKey);
  if (cached) return cached;

  const promise = loadStripe(publishableKey, {
    locale: locale as StripeElementLocale,
  }).catch(error => {
    stripePromiseCache.delete(cacheKey);
    throw error;
  });

  stripePromiseCache.set(cacheKey, promise);
  return promise;
}
