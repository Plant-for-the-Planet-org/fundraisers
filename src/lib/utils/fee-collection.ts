/**
 * Check if fee collection is enabled via environment variable.
 * Defaults to true when the env var is missing.
 */
export function isFeeCollectionEnabled(): boolean {
  const allowFeeCollection = process.env.NEXT_PUBLIC_ALLOW_FEE_COLLECTION;

  if (allowFeeCollection === undefined) {
    return true;
  }

  return allowFeeCollection.toLowerCase() === 'true';
}
