// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Error reporting only. We deliberately do NOT enable performance tracing
  // (tracesSampleRate) or log forwarding (enableLogs): sampling real users'
  // navigation/performance is the part a strict EU/German (DSK) reading would
  // treat as non-essential and consent-requiring. Plain crash reporting is
  // defensible as legitimate interest and sets no cookie — which is what lets
  // us drop the cookie banner. Keep it this way unless legal signs off.

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
