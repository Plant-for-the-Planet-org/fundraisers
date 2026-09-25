import { vi } from 'vitest';

/**
 * For tests: replaces the global fetch with one response per URL and records every URL asked for.
 * A URL with no response throws, so a test can prove a host was never contacted.
 * Pass `inits` to also record the options of each call, in the same order.
 */
export function mockFetch(
  responses: Record<string, () => Response>,
  inits?: Array<RequestInit | undefined>
): string[] {
  const calls: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    calls.push(url);
    inits?.push(init);
    const make = responses[url];
    if (!make) throw new Error(`unexpected fetch ${url}`);
    return make();
  });
  return calls;
}
