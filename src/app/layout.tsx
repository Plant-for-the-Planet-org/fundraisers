import type { Metadata } from 'next';

import {
  Inter,
  Open_Sans,
  Playfair_Display,
  Poppins,
  Roboto,
} from 'next/font/google';
import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import { Toaster } from 'sonner';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { UmamiAnalytics } from '@/components/analytics/umami-analytics';
import { AuthInitializer } from '@/components/auth/auth-initializer';
import { ImpersonationBanner } from '@/components/auth/impersonation-banner';
import { ProfileSetupRetry } from '@/components/auth/profile-setup-retry';
import { CookieConsentProvider } from '@/components/cookie/cookie-consent-provider';
import { LocaleInitializer } from '@/components/locale-initializer';
import { LocaleProfileSync } from '@/components/locale-profile-sync';

import './globals.css';
import 'vanilla-cookieconsent/dist/cookieconsent.css';

const openSans = Open_Sans({
  variable: '--font-open-sans-var',
  subsets: ['latin'],
  display: 'swap',
});
const inter = Inter({
  variable: '--font-inter-var',
  subsets: ['latin'],
  display: 'swap',
});
const poppins = Poppins({
  variable: '--font-poppins-var',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});
const playfair = Playfair_Display({
  variable: '--font-playfair-var',
  subsets: ['latin'],
  display: 'swap',
});
const roboto = Roboto({
  variable: '--font-roboto-var',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
});

async function getMetadataBase(): Promise<URL> {
  const headersList = await headers();
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const protocol =
    headersList.get('x-forwarded-proto') ??
    (host?.includes('localhost') ? 'http' : 'https');

  if (host) {
    return new URL(`${protocol}://${host}`);
  }

  return new URL('http://localhost:3000');
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Common.metadata');
  return {
    metadataBase: await getMetadataBase(),
    title: t('title'),
    description: t('description'),
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') ?? '/';
  const theme = getThemeForPath(pathname);

  return (
    <html lang={locale} className={theme.mode}>
      <body
        className={`
        ${openSans.variable} ${inter.variable} ${poppins.variable}
        ${playfair.variable} ${roboto.variable} antialiased
      `}
      >
        <NextIntlClientProvider messages={messages}>
          <LocaleInitializer initialLocale={locale} />
          <LocaleProfileSync />
          {/* Mounted before AuthInitializer so its toast subscription is ready
              when AuthInitializer fires a sign-in-error toast during mount. */}
          <Toaster richColors />
          <AuthInitializer />
          <ProfileSetupRetry />
          <CookieConsentProvider />
          <UmamiAnalytics />
          <ImpersonationBanner />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
