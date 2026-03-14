import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  compress: true,
  generateEtags: true,
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
      './locales/en/auth.json',
      './locales/en/dashboard.json',
    ],
  },
});

export default withNextIntl(nextConfig);
