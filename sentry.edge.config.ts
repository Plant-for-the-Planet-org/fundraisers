// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

const isDev = process.env.NODE_ENV === 'development';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Off in local dev to save CPU/memory; active for all builds (preview + prod).
  enabled: !isDev,

  // 1 = track 100% requests (good for dev)
  // 0.1 = track 10% requests (recommended for production to reduce cost)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,
});
