// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 1 = track 100% requests (good for dev)
  // 0.1 = track 10% requests (recommended for production to reduce cost)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Ignore known non-critical / noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    /Loading chunk \d+ failed/,
  ],

  // Filter events before sending to Sentry
  beforeSend(event) {
    // Ignore errors from browser extensions
    const frames = event.exception?.values?.[0]?.stacktrace?.frames;
    // Ignore errors coming from browser extensions (not your code)
    if (frames?.some(f => f.filename?.includes('extensions://'))) {
      return null;
    }
    // Send all other valid errors
    return event;
  },

  // Block errors originating from specific URLs/sources
  denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
