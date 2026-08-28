import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    // update this if we need to test components using .tsx files or other non-.ts files
    include: ['src/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_API_BASE_URL: 'https://api.test.example',
      NEXT_PUBLIC_CDN_URL: 'https://cdn.test.example',
      // auth0-config.ts throws at import without this, which puts every module that reaches it out of test range.
      NEXT_PUBLIC_AUTH0_CLIENT_ID: 'test-client-id',
    },
  },
});
