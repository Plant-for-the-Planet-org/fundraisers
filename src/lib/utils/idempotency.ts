/**
 * Generates a unique idempotency key
 * Uses crypto.randomUUID() which provides a cryptographically secure random UUID
 *
 * @returns A unique string suitable for use as an idempotency key
 */
export function generateIdempotencyKey(): string {
  // Use crypto.randomUUID() for secure random generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID()
  return `idem_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Generates an idempotency key with a custom prefix
 * Useful for categorizing different types of operations
 *
 * @param prefix - Custom prefix for the key (e.g., 'donation', 'payment')
 * @returns A unique string with the specified prefix
 */
export function generateIdempotencyKeyWithPrefix(prefix: string): string {
  const baseKey = generateIdempotencyKey();
  return `${prefix}_${baseKey}`;
}
