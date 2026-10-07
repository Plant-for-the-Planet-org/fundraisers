import type { Event } from '@sentry/nextjs';

/** Sent by the browser to our Insights routes while a staffer impersonates a user. Sentry's default scrubbing does not know these names, and one is a support pin, the other an email. */
const IMPERSONATION_HEADERS = new Set(['x-switch-user', 'x-user-support-pin']);

export function stripImpersonationHeaders<T extends Event>(event: T): T {
  const headers = event.request?.headers;
  if (!headers) return event;
  for (const name of Object.keys(headers)) {
    if (IMPERSONATION_HEADERS.has(name.toLowerCase())) delete headers[name];
  }
  return event;
}
