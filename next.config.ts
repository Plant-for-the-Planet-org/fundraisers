import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  redirects: async () => {
    return [
      {
        source: '/',
        destination: '/explore',
        permanent: false,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin({
  requestConfig: './src/i18n/request.ts',
  experimental: {
    createMessagesDeclaration: [
      './locales/en/common.json',
      './locales/en/explore.json',
      './locales/en/fundraisers.json',
    ],
  },
});

export default withNextIntl(nextConfig);
