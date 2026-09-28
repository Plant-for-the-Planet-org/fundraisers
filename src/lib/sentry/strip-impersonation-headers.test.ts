import type { Event } from '@sentry/nextjs';

import { describe, expect, it } from 'vitest';
import { stripImpersonationHeaders } from './strip-impersonation-headers';

describe('stripImpersonationHeaders', () => {
  it('removes the impersonation headers in any case and keeps the rest', () => {
    const event: Event = {
      request: {
        headers: {
          'X-Switch-User': 'user@example.com',
          'x-user-support-pin': '1234',
          'content-type': 'application/json',
        },
      },
    };

    expect(stripImpersonationHeaders(event).request?.headers).toEqual({
      'content-type': 'application/json',
    });
  });

  it('leaves an event without request headers unchanged', () => {
    const event: Event = { message: 'boom' };
    expect(stripImpersonationHeaders(event)).toEqual({ message: 'boom' });
  });
});
