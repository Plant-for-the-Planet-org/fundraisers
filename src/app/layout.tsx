import type { Metadata } from 'next';

import { headers } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import {
  Open_Sans,
  Inter,
  Poppins,
  Playfair_Display,
  Roboto,
} from 'next/font/google';
import { LocaleInitializer } from '@/components/locale-initializer';
import './globals.css';
import { getThemeForPath } from '@/lib/theme/route-themes';
import { AuthInitializer } from '@/lib/auth/auth-initializer';

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

export const metadata: Metadata = {
  title: 'Fundraisers',
  description: 'Fundraising platform',
};

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
          <AuthInitializer />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
