import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withRetry } from './utils';

describe('withRetry', () => {
  // withRetry waits between attempts with setTimeout. Fake timers let us fast-forward that backoff instead of really sleeping for seconds.
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the result and does not retry when fn succeeds', async () => {
    const fn = vi.fn().mockResolvedValue('ok');

    await expect(withRetry(fn, 2)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries after failures and returns the first success', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const promise = withRetry(fn, 2);
    await vi.runAllTimersAsync(); // flush both backoff waits

    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('throws the last error after exhausting all retries', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockRejectedValue(new Error('fail 3'));

    const promise = withRetry(fn, 2);
    // Attach the rejection expectation before advancing timers so the rejection is never seen as unhandled.
    const assertion = expect(promise).rejects.toThrow('fail 3');
    await vi.runAllTimersAsync();
    await assertion;

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('clamps a negative maxRetries to a single attempt', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(withRetry(fn, -5)).rejects.toThrow('boom');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
