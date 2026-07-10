import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/stores/impersonation-store', () => ({
  useImpersonationStore: {
    getState: vi.fn(() => ({ isActive: false, email: null, pin: null })),
  },
}));

import type { PlatformAPIError } from './platform-fetch';

import { useImpersonationStore } from '@/stores/impersonation-store';
import { platformFetch } from './platform-fetch';

const getState = useImpersonationStore.getState as ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('platformFetch', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    getState.mockReturnValue({ isActive: false, email: null, pin: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('header injection', () => {
    it('always sends X-SESSION-ID', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await platformFetch('/foo');

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['X-SESSION-ID']).toBeTruthy();
    });

    it('sends Authorization only when a token is provided', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await platformFetch('/foo', { token: 'tok_123' });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Authorization']).toBe('Bearer tok_123');
    });

    it('omits Authorization when no token is provided', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await platformFetch('/foo');

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Authorization']).toBeUndefined();
    });

    it('sets Content-Type: application/json for a JSON body', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await platformFetch('/foo', { method: 'POST', body: { a: 1 } });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.body).toBe(JSON.stringify({ a: 1 }));
    });

    it('does not set Content-Type for a FormData body and sends it as-is', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      const form = new FormData();
      form.append('file', 'contents');

      await platformFetch('/foo', { method: 'POST', body: form });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Content-Type']).toBeUndefined();
      expect(init.body).toBe(form);
    });

    it('sends a trimmed Idempotency-Key when provided', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await platformFetch('/foo', { idempotencyKey: '  key-1  ' });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Idempotency-Key']).toBe('key-1');
    });

    it('omits Idempotency-Key when it is blank', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await platformFetch('/foo', { idempotencyKey: '   ' });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['Idempotency-Key']).toBeUndefined();
    });

    it('adds impersonation headers only when a token is passed and impersonation is active', async () => {
      getState.mockReturnValue({
        isActive: true,
        email: 'user@example.com',
        pin: '1234',
      });
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

      await platformFetch('/foo', { token: 'tok_123' });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['x-switch-user']).toBe('user@example.com');
      expect(init.headers['x-user-support-pin']).toBe('1234');
    });

    it('does not add impersonation headers without a token, even if impersonation is active', async () => {
      getState.mockReturnValue({
        isActive: true,
        email: 'user@example.com',
        pin: '1234',
      });
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

      await platformFetch('/foo');

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['x-switch-user']).toBeUndefined();
      expect(init.headers['x-user-support-pin']).toBeUndefined();
    });

    it('skips impersonation headers when skipImpersonationFromStore is set', async () => {
      getState.mockReturnValue({
        isActive: true,
        email: 'user@example.com',
        pin: '1234',
      });
      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

      await platformFetch('/foo', {
        token: 'tok_123',
        skipImpersonationFromStore: true,
      });

      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['x-switch-user']).toBeUndefined();
      expect(init.headers['x-user-support-pin']).toBeUndefined();
    });
  });

  describe('error classification', () => {
    it('maps an AbortSignal timeout to a PlatformAPIError of kind "timeout"', async () => {
      fetchMock.mockRejectedValueOnce(
        new DOMException('The operation timed out.', 'TimeoutError')
      );

      await expect(
        platformFetch('/foo', { timeoutMs: 10 })
      ).rejects.toMatchObject({
        kind: 'timeout',
        status: 0,
      } satisfies Partial<PlatformAPIError>);
    });

    it('maps a fetch throw to a PlatformAPIError of kind "network"', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(platformFetch('/foo')).rejects.toMatchObject({
        kind: 'network',
        status: 0,
      } satisfies Partial<PlatformAPIError>);
    });

    it('maps a non-2xx response to a PlatformAPIError of kind "http" with the parsed body', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 422));

      await expect(platformFetch('/foo')).rejects.toMatchObject({
        kind: 'http',
        status: 422,
        body: { message: 'nope' },
      } satisfies Partial<PlatformAPIError>);
    });
  });

  describe('response body parsing', () => {
    it('returns undefined for a 204 response', async () => {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

      await expect(platformFetch('/foo')).resolves.toBeUndefined();
    });

    it('returns undefined for an empty response body', async () => {
      fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));

      await expect(platformFetch('/foo')).resolves.toBeUndefined();
    });

    it('parses a JSON response body', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ a: 1, b: 'two' }));

      await expect(platformFetch('/foo')).resolves.toEqual({ a: 1, b: 'two' });
    });

    it('returns a text response body as-is', async () => {
      fetchMock.mockResolvedValueOnce(
        new Response('plain text body', {
          status: 200,
          headers: { 'content-type': 'text/plain' },
        })
      );

      await expect(platformFetch('/foo')).resolves.toBe('plain text body');
    });
  });
});
